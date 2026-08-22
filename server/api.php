<?php
/**
 * АВТОСКЛАД-24 · PHP-API для MySQL-хранилища склада
 * -------------------------------------------------
 *   GET  api.php?do=pull   — получить весь склад: { cars, deleted, rev, savedAt }
 *   POST api.php?do=push   — заменить склад целиком (JSON-тело: { cars, deleted, rev, savedAt })
 *
 * Безопасность: при заданном API_KEY в config.php требуется заголовок X-Api-Key.
 */

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/* --- проверка ключа --- */
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
            PDO::ATTR_EMULATE_PREPARES   => false, // числа приходят как числа
        ]
    );
} catch (PDOException $e) {
    respond(['ok' => false, 'error' => 'Нет соединения с базой: ' . $e->getMessage()], 500);
}

$action = $_GET['do'] ?? '';

/* =========================================================================
 *  PULL — отдать склад целиком
 * ========================================================================= */
if ($action === 'pull') {
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
        ];
        if ($r['power']   !== null) $car['power'] = (int) $r['power'];
        if ($r['fuel']    !== null) $car['fuel']  = (string) $r['fuel'];
        if ($r['op_code'] !== null && $r['op_code'] !== '') $car['by'] = (string) $r['op_code'];
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

/* =========================================================================
 *  PUSH — заменить склад целиком (транзакция)
 * ========================================================================= */
if ($action === 'push') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);

    if (!is_array($body) || !isset($body['cars']) || !is_array($body['cars'])) {
        respond(['ok' => false, 'error' => 'Некорректный формат данных'], 400);
    }

    $cars    = $body['cars'];
    $deleted = isset($body['deleted']) && is_array($body['deleted']) ? $body['deleted'] : [];
    $rev     = isset($body['rev']) ? (int) $body['rev'] : 0;
    $savedAt = isset($body['savedAt']) ? (int) $body['savedAt'] : (int) (microtime(true) * 1000);

    $insCar = $pdo->prepare(
        'INSERT INTO `cars`
            (`id`, `photo`, `make`, `model`, `year`, `country`, `trim_name`, `mileage`,
             `drive`, `engine_volume`, `power`, `fuel`, `gearbox`, `color`, `price`,
             `added_at`, `updated_at`, `op_code`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $insDel = $pdo->prepare(
        'INSERT INTO `deleted_cars` (`car_id`, `deleted_at`) VALUES (?, ?)'
    );

    $pdo->beginTransaction();
    try {
        $pdo->exec('DELETE FROM `cars`');
        $pdo->exec('DELETE FROM `deleted_cars`');

        foreach ($cars as $c) {
            if (!is_array($c) || empty($c['id']) || empty($c['make'])) continue;
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
                isset($c['by']) ? mb_substr((string) $c['by'], 0, 20) : null,
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

respond(['ok' => false, 'error' => 'Неизвестное действие. Используйте ?do=pull или ?do=push'], 400);
