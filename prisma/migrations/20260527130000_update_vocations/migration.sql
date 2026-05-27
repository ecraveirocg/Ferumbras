-- Update Vocation enum: remove base classes, add EXALTED_MONK
ALTER TABLE `Character` MODIFY COLUMN `vocation` ENUM('ELITE_KNIGHT', 'ROYAL_PALADIN', 'MASTER_SORCERER', 'ELDER_DRUID', 'EXALTED_MONK') NOT NULL;
