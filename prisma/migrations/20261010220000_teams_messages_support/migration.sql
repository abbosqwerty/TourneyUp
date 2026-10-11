-- AlterTable
ALTER TABLE `Channel` ADD COLUMN `teamId` VARCHAR(191) NULL,
    MODIFY `type` ENUM('ORGANIZATION', 'TOURNAMENT', 'TEAM') NOT NULL;

-- AlterTable
ALTER TABLE `ChannelPost` ADD COLUMN `kind` ENUM('ANNOUNCEMENT', 'MESSAGE', 'SYSTEM') NOT NULL DEFAULT 'MESSAGE';

-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('PARTICIPANT_APPROVED', 'PARTICIPANT_REJECTED', 'PARTICIPANT_REGISTERED', 'TOURNAMENT_STATUS', 'STAFF_ASSIGNED', 'CHANNEL_POST', 'TEAM_INVITE', 'TEAM_MEMBERSHIP', 'TEAM_REGISTERED', 'SUPPORT_REPLY', 'POINTS_AWARDED') NOT NULL;

-- AlterTable
ALTER TABLE `Participant` ADD COLUMN `teamId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Team` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `sport` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `logoMediaId` VARCHAR(191) NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `disbandedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Team_slug_key`(`slug`),
    INDEX `Team_ownerId_idx`(`ownerId`),
    UNIQUE INDEX `Team_ownerId_name_key`(`ownerId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamMember` (
    `id` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'CAPTAIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leftAt` DATETIME(3) NULL,

    INDEX `TeamMember_userId_leftAt_idx`(`userId`, `leftAt`),
    UNIQUE INDEX `TeamMember_teamId_userId_key`(`teamId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamInvite` (
    `id` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `invitedUserId` VARCHAR(191) NOT NULL,
    `invitedById` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TeamInvite_invitedUserId_status_idx`(`invitedUserId`, `status`),
    INDEX `TeamInvite_teamId_status_idx`(`teamId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParticipantRosterMember` (
    `id` VARCHAR(191) NOT NULL,
    `participantId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ParticipantRosterMember_participantId_userId_key`(`participantId`, `userId`),
    UNIQUE INDEX `ParticipantRosterMember_tournamentId_userId_key`(`tournamentId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportTicket` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `scope` ENUM('PLATFORM', 'TOURNAMENT') NOT NULL,
    `tournamentId` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `category` ENUM('TECHNICAL', 'TOURNAMENT_ISSUE', 'REPORT_BEHAVIOR', 'ACCOUNT', 'OTHER') NOT NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `userLastReadAt` DATETIME(3) NULL,
    `staffLastReadAt` DATETIME(3) NULL,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SupportTicket_userId_lastMessageAt_idx`(`userId`, `lastMessageAt`),
    INDEX `SupportTicket_scope_status_lastMessageAt_idx`(`scope`, `status`, `lastMessageAt`),
    INDEX `SupportTicket_tournamentId_status_idx`(`tournamentId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportMessage` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isStaff` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SupportMessage_ticketId_createdAt_idx`(`ticketId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Channel_teamId_key` ON `Channel`(`teamId`);

-- CreateIndex
CREATE UNIQUE INDEX `Participant_tournamentId_teamId_key` ON `Participant`(`tournamentId`, `teamId`);

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_logoMediaId_fkey` FOREIGN KEY (`logoMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamInvite` ADD CONSTRAINT `TeamInvite_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamInvite` ADD CONSTRAINT `TeamInvite_invitedUserId_fkey` FOREIGN KEY (`invitedUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamInvite` ADD CONSTRAINT `TeamInvite_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ParticipantRosterMember` ADD CONSTRAINT `ParticipantRosterMember_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `Participant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ParticipantRosterMember` ADD CONSTRAINT `ParticipantRosterMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportMessage` ADD CONSTRAINT `SupportMessage_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `SupportTicket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportMessage` ADD CONSTRAINT `SupportMessage_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

