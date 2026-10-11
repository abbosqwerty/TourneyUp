-- CreateTable
CREATE TABLE `PointAward` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,
    `participantId` VARCHAR(191) NULL,
    `placement` INTEGER NULL,
    `basePoints` INTEGER NOT NULL,
    `fieldSize` INTEGER NOT NULL,
    `points` INTEGER NOT NULL,
    `sport` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `earnedAt` DATETIME(3) NOT NULL,
    `configVersion` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PointAward_earnedAt_idx`(`earnedAt`),
    INDEX `PointAward_sport_earnedAt_idx`(`sport`, `earnedAt`),
    INDEX `PointAward_userId_idx`(`userId`),
    UNIQUE INDEX `PointAward_tournamentId_userId_key`(`tournamentId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PointAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `previousPoints` INTEGER NOT NULL,
    `newPoints` INTEGER NOT NULL,
    `delta` INTEGER NOT NULL,
    `reason` ENUM('FINALIZED', 'RESULT_CORRECTED', 'TOURNAMENT_CANCELLED', 'RECALCULATED') NOT NULL,
    `note` TEXT NULL,
    `actorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PointAuditLog_tournamentId_createdAt_idx`(`tournamentId`, `createdAt`),
    INDEX `PointAuditLog_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PointAward` ADD CONSTRAINT `PointAward_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PointAward` ADD CONSTRAINT `PointAward_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PointAward` ADD CONSTRAINT `PointAward_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `Participant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PointAuditLog` ADD CONSTRAINT `PointAuditLog_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PointAuditLog` ADD CONSTRAINT `PointAuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PointAuditLog` ADD CONSTRAINT `PointAuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

