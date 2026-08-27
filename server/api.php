<?php
/**
 * АВТОСКЛАД-24 · PHP-API (MySQL + пользователи)
 * -------------------------------------------------
 * Публичные (без сессии):
 *   POST api.php?do=register  {login, name, password} → {ok, token, user}
 *   POST api.php?do=login     {login, password}       → {ok, token, user}
 *
 * Требуют токен (заголовок X-Auth-Token):
 *   GET  api.php?do=me                                → {ok, user}
 *   POST api.php?do=logout                            → {ok}
 *   GET  api.php?do=pull                              → {cars, deleted, rev, savedAt}
 *   POST api.php?do=push      {cars, deleted, rev}    → {ok, rev, count}
 *
 * Примечание: первый зарегистрированный пользователь получает роль admin.
 */

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key, X-Auth-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function body(): array {
    $j = json_decode((string) file_get_contents('php://input'), true);
    return is_array($j) ? $j : [];
}

function nowMs(): int {
    return (int) round(microtime(true) * 1000);
}

function publicUser(array $u): array {
    return [
        'id'    => (string) $u['id'],
        'login' => (string) $u['login'],
        'name'  => (string) $u['name'],
        'role'  => (string) $u['role'],
    ];
}

/* --- ключ доступа (если задан в config.php) --- */
if (API_KEY !== '') {
    $key = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (!hash_equals(API_KEY, $key)) {
        respond(['ok' => false, 'error' => 'Неверный ключ доступа'], 403);
    }
}

/* --- подключение к БД --- */
try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    respond(['ok' => false, 'error' => 'Нет соединения с базой данных'], 500);
}

$action = $_GET['do'] ?? '';

/* =========================================================================
 *  ПОЛЬЗОВАТЕЛИ
 * ========================================================================= */

function createSession(PDO $pdo, int $userId): string {
    $token = bin2hex(random_bytes(32));
    $exp   = nowMs() + 30 * 24 * 3600 * 1000; // 30 суток
    $pdo->prepare('INSERT INTO `sessions` (`token`, `user_id`, `expires_at`) VALUES (?, ?, ?)')
        ->execute([$token, $userId, $exp]);
    return $token;
}

/** Возвращает пользователя по токену или завершает запрос с 401. */
function authUser(PDO $pdo): array {
    $token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    if ($token === '') {
        respond(['ok' => false, 'error' => 'Требуется вход в систему'], 401);
    }
    $st = $pdo->prepare(
        'SELECT u.id, u.login, u.name, u.role
           FROM `sessions` s JOIN `users` u ON u.id = s.user_id
          WHERE s.token = ? AND s.expires_at > ?'
    );
    $st->execute([$token, nowMs()]);
    $u = $st->fetch();
    if (!$u) {
        respond(['ok' => false, 'error' => 'Сессия истекла — войдите снова'], 401);
    }
    return $u;
}

/* ---- Регистрация ---- */
if ($action === 'register') {
    $b     = body();
    $login = mb_strtolower(trim((string) ($b['login'] ?? '')));
    $name  = trim((string) ($b['name'] ?? ''));
    $pass  = (string) ($b['password'] ?? '');

    if (!preg_match('/^[a-z0-9_]{3,20}$/', $login)) {
        respond(['ok' => false, 'error' => 'Логин: 3–20 символов — латиница, цифры и «_»'], 400);
    }
    if (mb_strlen($name) < 2 || mb_strlen($name) > 40) {
        respond(['ok' => false, 'error' => 'Укажите имя и фамилию (2–40 символов)'], 400);
    }
    if (strlen($pass) < 6) {
        respond(['ok' => false, 'error' => 'Пароль: минимум 6 символов'], 400);
    }

    $st = $pdo->prepare('SELECT `id` FROM `users` WHERE `login` = ?');
    $st->execute([$login]);
    if ($st->fetch()) {
        respond(['ok' => false, 'error' => 'Такой логин уже занят'], 400);
    }

    // первый пользователь — администратор
    $count = (int) $pdo->query('SELECT COUNT(*) FROM `users`')->fetchColumn();
    $role  = $count === 0 ? 'admin' : 'operator';

    $pdo->prepare(
        'INSERT INTO `users` (`login`, `name`, `pass_hash`, `role`, `created_at`)
         VALUES (?, ?, ?, ?, ?)'
    )->execute([$login, $name, password_hash($pass, PASSWORD_DEFAULT), $role, nowMs()]);

    $userId = (int) $pdo->lastInsertId();
    respond([
        'ok'    => true,
        'token' => createSession($pdo, $userId),
        'user'  => ['id' => (string) $userId, 'login' => $login, 'name' => $name, 'role' => $role],
    ]);
}

/* ---- Вход ---- */
if ($action === 'login') {
    $b     = body();
    $login = mb_strtolower(trim((string) ($b['login'] ?? '')));
    $pass  = (string) ($b['password'] ?? '');

    $st = $pdo->prepare('SELECT * FROM `users` WHERE `login` = ?');
    $st->execute([$login]);
    $u = $st->fetch();

    if (!$u || !password_verify($pass, $u['pass_hash'])) {
        respond(['ok' => false, 'error' => 'Неверный логин или пароль'], 401);
    }

    respond(['ok' => true, 'token' => createSession($pdo, (int) $u['id']), 'user' => publicUser($u)]);
}

/* ---- Текущий пользователь ---- */
if ($action === 'me') {
    $u = authUser($pdo);
    respond(['ok' => true, 'user' => publicUser($u)]);
}

/* ---- Выход ---- */
if ($action === 'logout') {
    $token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    if ($token !== '') {
        $pdo->prepare('DELETE FROM `sessions` WHERE `token` = ?')->execute([$token]);
    }
    respond(['ok' => true]);
}

/* =========================================================================
 *  СКЛАД (только для авторизованных)
 * ========================================================================= */

/* ---- Чтение ---- */
if ($action === 'pull') {
    $u    = authUser($pdo);
    $rows = $pdo->query('SELECT * FROM `cars`')->fetchAll();

    $cars = [];
    foreach ($rows as $r) {
        $car = [
            'id'        => (string) $r['id'],
            'photo'     => $r['photo'] !== null ? (string) $r['photo'] : null,
            'make'      => (string) $r['make'],
            'model'     => (string) $r['model'],
            'year'      => (int)    $r['year'],
            'country'   => (string) $r['country'],
            'trim'      => (string) $r['trim_name'],
            'mileage'   => (int)    $r['mileage'],
            'drive'     => (string) $r['drive'],
            'engine'    => (string) $r['engine_volume'],
            'gearbox'   => (string) $r['gearbox'],
            'color'     => (string) $r['color'],
            'price'     => (int)    $r['price'],
            'addedAt'   => (int)    $r['added_at'],
            'updatedAt' => (int)    $r['updated_at'],
            'condition' => (string) $r['condition'],
            'bodyType'  => isset($r['body_type']) ? (string) $r['body_type'] : null,
        ];
        if ($r['power'] !== null)        $car['power']        = (int) $r['power'];
        if ($r['fuel'] !== null)         $car['fuel']         = (string) $r['fuel'];
        if ($r['last_editor'] !== null)  $car['lastEditor']   = (string) $r['last_editor'];
        if ($r['last_edited_at'] !== null) $car['lastEditedAt'] = (int) $r['last_edited_at'];
        $cars[] = $car;
    }

    $deleted = [];
    foreach ($pdo->query('SELECT `car_id`, `deleted_at` FROM `deleted_cars`') as $d) {
        $deleted[] = ['id' => (string) $d['car_id'], 'at' => (int) $d['deleted_at']];
    }

    $meta = $pdo->query('SELECT `rev`, `saved_at` FROM `stock_meta` WHERE `id` = 1')->fetch();

    respond([
        'cars'    => $cars,
        'deleted' => $deleted,
        'rev'     => $meta ? (int) $meta['rev'] : 0,
        'savedAt' => $meta ? (int) $meta['saved_at'] : 0,
    ]);
}

/* ---- Запись (полная замена в транзакции) ---- */
if ($action === 'push') {
    $u    = authUser($pdo);
    $b    = body();

    if (!isset($b['cars']) || !is_array($b['cars'])) {
        respond(['ok' => false, 'error' => 'Некорректный формат данных'], 400);
    }

    $cars    = $b['cars'];
    $deleted = isset($b['deleted']) && is_array($b['deleted']) ? $b['deleted'] : [];
    $rev     = isset($b['rev']) ? (int) $b['rev'] : 0;
    $savedAt = isset($b['savedAt']) ? (int) $b['savedAt'] : nowMs();

    $insCar = $pdo->prepare(
        'INSERT INTO `cars`
            (`id`, `photo`, `make`, `model`, `year`, `country`, `trim_name`, `mileage`,
             `drive`, `engine_volume`, `power`, `fuel`, `gearbox`, `color`, `price`,
             `added_at`, `updated_at`, `last_editor`, `last_editor_id`, `last_edited_at`, `condition`, `body_type`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $insDel = $pdo->prepare('INSERT INTO `deleted_cars` (`car_id`, `deleted_at`) VALUES (?, ?)');

    $pdo->beginTransaction();
    try {
        $pdo->exec('DELETE FROM `cars`');
        $pdo->exec('DELETE FROM `deleted_cars`');

        foreach ($cars as $c) {
            if (!is_array($c) || empty($c['id']) || empty($c['make'])) continue;

            // если клиент не указал редактора — ставим текущего пользователя
            $le   = isset($c['lastEditor'])   ? mb_substr((string) $c['lastEditor'], 0, 60) : $u['name'];
            $lei  = isset($c['lastEditorId']) ? (int) $c['lastEditorId'] : (int) $u['id'];
            $lea  = isset($c['lastEditedAt']) ? (int) $c['lastEditedAt'] : $savedAt;
            $cond = isset($c['condition']) ? mb_substr((string) $c['condition'], 0, 20) : 'С пробегом';
            $bt   = isset($c['bodyType']) ? mb_substr((string) $c['bodyType'], 0, 30) : null;

            $insCar->execute([
                (string) $c['id'],
                isset($c['photo']) ? (string) $c['photo'] : null,
                mb_substr((string) ($c['make']  ?? ''), 0, 100),
                mb_substr((string) ($c['model'] ?? ''), 0, 100),
                (int)    ($c['year']    ?? 2000),
                mb_substr((string) ($c['country'] ?? ''), 0, 100),
                mb_substr((string) ($c['trim']    ?? ''), 0, 100),
                max(0, (int) ($c['mileage'] ?? 0)),
                mb_substr((string) ($c['drive']   ?? 'Передний'), 0, 20),
                mb_substr((string) ($c['engine']  ?? ''), 0, 20),
                isset($c['power']) ? min(9999, max(0, (int) $c['power'])) : null,
                isset($c['fuel'])  ? mb_substr((string) $c['fuel'], 0, 20) : null,
                mb_substr((string) ($c['gearbox'] ?? 'Механика'), 0, 20),
                mb_substr((string) ($c['color']   ?? ''), 0, 60),
                max(0, (int) ($c['price'] ?? 0)),
                (int) ($c['addedAt'] ?? $savedAt),
                (int) ($c['updatedAt'] ?? 0),
                $le, $lei, $lea, $cond, $bt,
            ]);
        }

        foreach ($deleted as $d) {
            if (!is_array($d) || empty($d['id'])) continue;
            $insDel->execute([(string) $d['id'], (int) ($d['at'] ?? $savedAt)]);
        }

        $pdo->prepare(
            'INSERT INTO `stock_meta` (`id`, `rev`, `saved_at`) VALUES (1, ?, ?)
             ON DUPLICATE KEY UPDATE `rev` = VALUES(`rev`), `saved_at` = VALUES(`saved_at`)'
        )->execute([$rev, $savedAt]);

        $pdo->commit();
        respond(['ok' => true, 'rev' => $rev, 'count' => count($cars)]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        respond(['ok' => false, 'error' => 'Ошибка записи: ' . $e->getMessage()], 500);
    }
}

respond(['ok' => false, 'error' => 'Неизвестное действие (register / login / me / logout / pull / push)'], 400);
