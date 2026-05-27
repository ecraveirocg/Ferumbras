CREATE TABLE `TibiaItemCache` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(191) NOT NULL,
  `image`     TEXT         NULL,
  `updatedAt` DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `TibiaItemCache_name_key` (`name`),
  INDEX `TibiaItemCache_name_idx` (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
