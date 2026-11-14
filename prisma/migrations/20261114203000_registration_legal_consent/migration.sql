ALTER TABLE `User`
  ADD COLUMN `termsAcceptedAt` DATETIME(3) NULL,
  ADD COLUMN `termsVersion` VARCHAR(191) NULL,
  ADD COLUMN `privacyAcceptedAt` DATETIME(3) NULL,
  ADD COLUMN `privacyVersion` VARCHAR(191) NULL;

ALTER TABLE `EmailRegistration`
  ADD COLUMN `termsAcceptedAt` DATETIME(3) NULL,
  ADD COLUMN `termsVersion` VARCHAR(191) NULL,
  ADD COLUMN `privacyAcceptedAt` DATETIME(3) NULL,
  ADD COLUMN `privacyVersion` VARCHAR(191) NULL;
