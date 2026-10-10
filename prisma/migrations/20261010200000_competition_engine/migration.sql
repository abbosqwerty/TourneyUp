-- AlterTable
ALTER TABLE `Match` ADD COLUMN `bracket` ENUM('MAIN', 'WINNERS', 'LOSERS', 'GRAND_FINAL', 'THIRD_PLACE', 'GROUP', 'SWISS', 'MANUAL') NOT NULL DEFAULT 'MAIN',
    ADD COLUMN `finalizedAt` DATETIME(3) NULL,
    ADD COLUMN `groupId` VARCHAR(191) NULL,
    ADD COLUMN `isBye` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `loserNextMatchId` VARCHAR(191) NULL,
    ADD COLUMN `loserNextSlot` ENUM('HOME', 'AWAY') NULL,
    ADD COLUMN `nextMatchId` VARCHAR(191) NULL,
    ADD COLUMN `nextSlot` ENUM('HOME', 'AWAY') NULL,
    ADD COLUMN `position` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `resultType` ENUM('NORMAL', 'FORFEIT', 'BYE') NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN `round` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `winnerParticipantId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Participant` ADD COLUMN `seed` INTEGER NULL;

-- AlterTable
ALTER TABLE `Tournament` ADD COLUMN `drawGeneratedAt` DATETIME(3) NULL,
    ADD COLUMN `format` ENUM('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'GROUPS_KNOCKOUT', 'SWISS') NOT NULL DEFAULT 'SINGLE_ELIMINATION',
    ADD COLUMN `formatConfigJson` TEXT NULL,
    ADD COLUMN `participantType` ENUM('INDIVIDUAL', 'TEAM') NOT NULL DEFAULT 'INDIVIDUAL',
    ADD COLUMN `resultsFinalizedAt` DATETIME(3) NULL,
    ADD COLUMN `teamSize` INTEGER NULL,
    ADD COLUMN `teamSizeMax` INTEGER NULL;

-- CreateTable
CREATE TABLE `CompetitionGroup` (
    `id` VARCHAR(191) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,

    UNIQUE INDEX `CompetitionGroup_tournamentId_order_key`(`tournamentId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchResultRevision` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `previousHomeScore` INTEGER NULL,
    `previousAwayScore` INTEGER NULL,
    `previousWinnerId` VARCHAR(191) NULL,
    `previousResultType` ENUM('NORMAL', 'FORFEIT', 'BYE') NOT NULL,
    `newHomeScore` INTEGER NULL,
    `newAwayScore` INTEGER NULL,
    `newWinnerId` VARCHAR(191) NULL,
    `newResultType` ENUM('NORMAL', 'FORFEIT', 'BYE') NOT NULL,
    `reason` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MatchResultRevision_matchId_idx`(`matchId`),
    INDEX `MatchResultRevision_tournamentId_createdAt_idx`(`tournamentId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill: fixtures created by hand before the format engine become MANUAL,
-- numbered per tournament so the new unique key holds. Completed ones keep
-- their result as finalized.
UPDATE `Match` m
JOIN (
  SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `tournamentId` ORDER BY `createdAt`, `id`) AS rn
  FROM `Match`
) x ON x.`id` = m.`id`
SET m.`bracket` = 'MANUAL', m.`position` = x.rn;

UPDATE `Match`
SET `finalizedAt` = `updatedAt`,
    `winnerParticipantId` = CASE
      WHEN `homeScore` > `awayScore` THEN `homeParticipantId`
      WHEN `awayScore` > `homeScore` THEN `awayParticipantId`
      ELSE NULL
    END
WHERE `status` = 'completed';

-- CreateIndex
CREATE UNIQUE INDEX `Match_tournamentId_bracket_round_position_key` ON `Match`(`tournamentId`, `bracket`, `round`, `position`);

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `CompetitionGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_nextMatchId_fkey` FOREIGN KEY (`nextMatchId`) REFERENCES `Match`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_loserNextMatchId_fkey` FOREIGN KEY (`loserNextMatchId`) REFERENCES `Match`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_winnerParticipantId_fkey` FOREIGN KEY (`winnerParticipantId`) REFERENCES `Participant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompetitionGroup` ADD CONSTRAINT `CompetitionGroup_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchResultRevision` ADD CONSTRAINT `MatchResultRevision_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchResultRevision` ADD CONSTRAINT `MatchResultRevision_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchResultRevision` ADD CONSTRAINT `MatchResultRevision_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

