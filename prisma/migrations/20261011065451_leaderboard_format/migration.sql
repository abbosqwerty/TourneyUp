-- AlterTable
ALTER TABLE `Tournament` MODIFY `format` ENUM('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'GROUPS_KNOCKOUT', 'SWISS', 'LEADERBOARD') NOT NULL DEFAULT 'SINGLE_ELIMINATION';

-- CreateTable
CREATE TABLE `LeaderboardEntry` (
    `id` VARCHAR(191) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,
    `participantId` VARCHAR(191) NOT NULL,
    `round` INTEGER NOT NULL,
    `value` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `recordedById` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LeaderboardEntry_tournamentId_round_idx`(`tournamentId`, `round`),
    UNIQUE INDEX `LeaderboardEntry_tournamentId_participantId_round_key`(`tournamentId`, `participantId`, `round`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LeaderboardEntry` ADD CONSTRAINT `LeaderboardEntry_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaderboardEntry` ADD CONSTRAINT `LeaderboardEntry_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `Participant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
