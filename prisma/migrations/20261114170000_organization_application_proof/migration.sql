ALTER TABLE `OrganizationApplication`
  ADD COLUMN `proofFileName` VARCHAR(191) NULL,
  ADD COLUMN `proofMimeType` VARCHAR(191) NULL,
  ADD COLUMN `proofByteSize` INTEGER NULL,
  ADD COLUMN `proofData` LONGBLOB NULL;
