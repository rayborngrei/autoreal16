-- ============================================================================
--  АВТОСКЛАД-24 · База данных MySQL  (версия 3.0 — с пользователями)
--  ----------------------------------------------------------------------------
--  Импорт через phpMyAdmin:  выберите базу → вкладка «Импорт» → файл database.sql
--  Импорт через консоль:     mysql -u ПОЛЬЗОВАТЕЛЬ -p ИМЯ_БАЗЫ < database.sql
--  Кодировка: utf8mb4 (полная поддержка кириллицы).
--  Файл идемпотентен: его можно импортировать повторно — данные не потеряются.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. Пользователи системы
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT        COMMENT 'Идентификатор пользователя',
  `login`      VARCHAR(30)   NOT NULL                       COMMENT 'Логин (латиница, цифры, «_»)',
  `name`       VARCHAR(60)   NOT NULL                       COMMENT 'Имя и фамилия',
  `pass_hash`  VARCHAR(255)  NOT NULL                       COMMENT 'Хеш пароля (password_hash, bcrypt)',
  `role`       ENUM('admin','operator') NOT NULL DEFAULT 'operator' COMMENT 'Роль',
  `created_at` BIGINT        NOT NULL DEFAULT 0             COMMENT 'Дата регистрации, мс эпохи',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_login` (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Пользователи системы';

-- ----------------------------------------------------------------------------
-- 2. Сессии (токены доступа, 30 дней)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `token`      CHAR(64)     NOT NULL                        COMMENT 'Токен сессии',
  `user_id`    INT UNSIGNED NOT NULL                        COMMENT 'Пользователь',
  `expires_at` BIGINT       NOT NULL                        COMMENT 'Истечение, мс эпохи',
  PRIMARY KEY (`token`),
  KEY `idx_sessions_user` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Сессии доступа';

-- ----------------------------------------------------------------------------
-- 3. Единицы склада (автомобили)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cars` (
  `id`             VARCHAR(36)      NOT NULL                COMMENT 'Уникальный идентификатор единицы',
  `photo`          LONGTEXT         NULL                    COMMENT 'URL или dataURL (base64) фотографии',
  `make`           VARCHAR(100)     NOT NULL                COMMENT 'Марка',
  `model`          VARCHAR(100)     NOT NULL                COMMENT 'Модель',
  `year`           SMALLINT         NOT NULL                COMMENT 'Год выпуска',
  `country`        VARCHAR(100)     NOT NULL DEFAULT ''     COMMENT 'Страна выпуска',
  `trim_name`      VARCHAR(100)     NOT NULL DEFAULT ''     COMMENT 'Комплектация',
  `mileage`        INT UNSIGNED     NOT NULL DEFAULT 0      COMMENT 'Пробег, км',
  `drive`          VARCHAR(20)      NOT NULL                COMMENT 'Привод: Передний / Задний / Полный',
  `engine_volume`  VARCHAR(20)      NOT NULL DEFAULT ''     COMMENT 'Объём двигателя, напр. 2.5 л',
  `power`          SMALLINT UNSIGNED NULL                   COMMENT 'Мощность, л.с.',
  `fuel`           VARCHAR(20)      NULL                    COMMENT 'Тип: Бензиновый / Дизельный / Гибридный / Электрический',
  `gearbox`        VARCHAR(20)      NOT NULL                COMMENT 'КПП: Механика / Автомат / Вариатор / Робот',
  `color`          VARCHAR(60)      NOT NULL DEFAULT ''     COMMENT 'Цвет',
  `price`          INT UNSIGNED     NOT NULL DEFAULT 0      COMMENT 'Цена, руб.',
  `added_at`       BIGINT           NOT NULL                COMMENT 'Постановка на склад, мс эпохи',
  `updated_at`     BIGINT           NOT NULL DEFAULT 0      COMMENT 'Последняя правка, мс эпохи',
  `last_editor`    VARCHAR(60)      NULL                    COMMENT 'Кто последний редактировал (имя пользователя)',
  `last_editor_id` INT UNSIGNED     NULL                    COMMENT 'ID последнего редактора',
  `last_edited_at` BIGINT           NULL                    COMMENT 'Когда последний редактировал, мс эпохи',
  `condition`      ENUM('Новый','С пробегом') NOT NULL DEFAULT 'С пробегом' COMMENT 'Состояние автомобиля',
  `body_type`      VARCHAR(30)      NULL                    COMMENT 'Тип кузова: Седан / Хэтчбек / Универсал / Кроссовер / Внедорожник и т.д.',
  PRIMARY KEY (`id`),
  KEY `idx_cars_added` (`added_at`),
  KEY `idx_cars_make` (`make`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Единицы склада';

-- ----------------------------------------------------------------------------
-- 3b. Обновление уже существующей таблицы cars (для баз версии 2.0)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `upgrade_cars_v3`;
DELIMITER $$
CREATE PROCEDURE `upgrade_cars_v3`()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'cars' AND column_name = 'last_editor'
  ) THEN
    ALTER TABLE `cars`
      ADD COLUMN `last_editor`    VARCHAR(60)  NULL COMMENT 'Кто последний редактировал (имя пользователя)' AFTER `updated_at`,
      ADD COLUMN `last_editor_id` INT UNSIGNED NULL COMMENT 'ID последнего редактора'                      AFTER `last_editor`,
      ADD COLUMN `last_edited_at` BIGINT       NULL COMMENT 'Когда последний редактировал, мс эпохи'        AFTER `last_editor_id`;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'cars' AND column_name = 'condition'
  ) THEN
    ALTER TABLE `cars`
      ADD COLUMN `condition` ENUM('Новый','С пробегом') NOT NULL DEFAULT 'С пробегом' COMMENT 'Состояние автомобиля' AFTER `last_edited_at`;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'cars' AND column_name = 'body_type'
  ) THEN
    ALTER TABLE `cars`
      ADD COLUMN `body_type` VARCHAR(30) NULL COMMENT 'Тип кузова' AFTER `condition`;
  END IF;
END$$
DELIMITER ;
CALL `upgrade_cars_v3`();
DROP PROCEDURE IF EXISTS `upgrade_cars_v3`;

-- ----------------------------------------------------------------------------
-- 4. «Надгробия» — списанные единицы (чтобы удаление расходилось между терминалами)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `deleted_cars` (
  `car_id`     VARCHAR(36) NOT NULL COMMENT 'Идентификатор списанной единицы',
  `deleted_at` BIGINT      NOT NULL COMMENT 'Момент списания, мс эпохи',
  PRIMARY KEY (`car_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Списанные единицы';

-- ----------------------------------------------------------------------------
-- 5. Служебная строка: ревизия склада
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_meta` (
  `id`       TINYINT      NOT NULL DEFAULT 1,
  `rev`      INT UNSIGNED NOT NULL DEFAULT 0  COMMENT 'Ревизия (инкремент на каждое сохранение)',
  `saved_at` BIGINT       NOT NULL DEFAULT 0  COMMENT 'Время последнего сохранения, мс эпохи',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Служебные данные';

INSERT INTO `stock_meta` (`id`, `rev`, `saved_at`)
VALUES (1, 1, UNIX_TIMESTAMP() * 1000)
ON DUPLICATE KEY UPDATE `rev` = `rev`;

-- ----------------------------------------------------------------------------
-- 6. Демонстрационные автомобили (можно пропустить или очистить таблицу cars)
-- ----------------------------------------------------------------------------
INSERT INTO `cars`
  (`id`, `photo`, `make`, `model`, `year`, `country`, `trim_name`, `mileage`,
   `drive`, `engine_volume`, `power`, `fuel`, `gearbox`, `color`, `price`,
   `added_at`, `updated_at`, `condition`)
VALUES
  ('seed-1', 'https://image.qwenlm.ai/generated-images/4778eba5-6cad-413f-b014-3be72fb6e379/_result.png',
   'Toyota', 'Camry', 2021, 'Япония', 'Элеганс', 45000,
   'Передний', '2.5 л', 200, 'Бензиновый', 'Автомат', 'Серебристый', 2890000,
   UNIX_TIMESTAMP() * 1000 - 172800000, UNIX_TIMESTAMP() * 1000 - 172800000, 'С пробегом'),
  ('seed-2', 'https://image.qwenlm.ai/generated-images/75442256-70d2-44b9-8e31-204b55d070c9/_result.png',
   'BMW', 'X5', 2019, 'Германия', 'xLine', 78500,
   'Полный', '3.0 л', 249, 'Дизельный', 'Автомат', 'Чёрный', 5450000,
   UNIX_TIMESTAMP() * 1000 - 432000000, UNIX_TIMESTAMP() * 1000 - 432000000, 'С пробегом'),
  ('seed-3', 'https://image.qwenlm.ai/generated-images/c71edde0-d075-48a1-b0a5-f4a37e7dd62c/_result.png',
   'Kia', 'Rio', 2022, 'Россия', 'Comfort', 12300,
   'Передний', '1.6 л', 123, 'Бензиновый', 'Механика', 'Красный', 1650000,
   UNIX_TIMESTAMP() * 1000 - 86400000, UNIX_TIMESTAMP() * 1000 - 86400000, 'С пробегом'),
  ('seed-4', 'https://image.qwenlm.ai/generated-images/d2ae7d31-cce8-4cb3-9aef-987acb662ca1/_result.png',
   'Hyundai', 'Creta', 2021, 'Россия', 'Lifestyle', 34800,
   'Полный', '2.0 л', 149, 'Бензиновый', 'Автомат', 'Белый', 2150000,
   UNIX_TIMESTAMP() * 1000 - 691200000, UNIX_TIMESTAMP() * 1000 - 691200000, 'С пробегом'),
  ('seed-5', 'https://image.qwenlm.ai/generated-images/8d25d843-64ae-43e8-a135-3829916078e9/_result.png',
   'Volkswagen', 'Tiguan', 2020, 'Германия', 'Respect', 61200,
   'Передний', '1.4 л', 150, 'Дизельный', 'Робот', 'Серый', 2590000,
   UNIX_TIMESTAMP() * 1000 - 1036800000, UNIX_TIMESTAMP() * 1000 - 1036800000, 'С пробегом'),
  ('seed-6', 'https://image.qwenlm.ai/generated-images/d73e2654-e7c7-4e60-bcd8-0d9c5cd6bc16/_result.png',
   'Škoda', 'Octavia', 2020, 'Чехия', 'Ambition', 88900,
   'Передний', '1.6 л', 110, 'Бензиновый', 'Механика', 'Синий', 1990000,
   UNIX_TIMESTAMP() * 1000 - 1296000000, UNIX_TIMESTAMP() * 1000 - 1296000000, 'С пробегом')
ON DUPLICATE KEY UPDATE `make` = VALUES(`make`);

SET FOREIGN_KEY_CHECKS = 1;
