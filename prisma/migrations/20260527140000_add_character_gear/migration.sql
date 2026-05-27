-- CreateTable
CREATE TABLE `CharacterGear` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `characterId` INTEGER NOT NULL,
    `slots` TEXT NOT NULL DEFAULT '{}',
    `runes` TEXT NOT NULL DEFAULT '[]',
    `pots` TEXT NOT NULL DEFAULT '[]',
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CharacterGear_characterId_key`(`characterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CharacterGear` ADD CONSTRAINT `CharacterGear_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
