-- The old Match table held per-user mock history (opponent/score as text).
-- The new shape is a real fixture between two registered sides; there is no
-- sensible way to map the old rows, so the table is rebuilt from scratch.
DROP TABLE `Match`;

-- CreateTable
CREATE TABLE `Match` (
    `id` VARCHAR(191) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,
    `stage` VARCHAR(191) NOT NULL DEFAULT '',
    `status` ENUM('scheduled', 'live', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    `scheduledAt` DATETIME(3) NULL,
    `homeParticipantId` VARCHAR(191) NULL,
    `awayParticipantId` VARCHAR(191) NULL,
    `homeLabel` VARCHAR(191) NOT NULL,
    `awayLabel` VARCHAR(191) NOT NULL,
    `homeUserId` VARCHAR(191) NULL,
    `awayUserId` VARCHAR(191) NULL,
    `homeScore` INTEGER NULL,
    `awayScore` INTEGER NULL,
    `winnerUserId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `recordedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Match_tournamentId_status_idx`(`tournamentId`, `status`),
    INDEX `Match_homeUserId_idx`(`homeUserId`),
    INDEX `Match_awayUserId_idx`(`awayUserId`),
    INDEX `Match_winnerUserId_idx`(`winnerUserId`),
    INDEX `Match_status_scheduledAt_idx`(`status`, `scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Participant_tournamentId_status_idx` ON `Participant`(`tournamentId`, `status`);

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_homeParticipantId_fkey` FOREIGN KEY (`homeParticipantId`) REFERENCES `Participant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_awayParticipantId_fkey` FOREIGN KEY (`awayParticipantId`) REFERENCES `Participant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_homeUserId_fkey` FOREIGN KEY (`homeUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_awayUserId_fkey` FOREIGN KEY (`awayUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_winnerUserId_fkey` FOREIGN KEY (`winnerUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

