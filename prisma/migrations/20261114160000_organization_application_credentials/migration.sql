ALTER TABLE `OrganizationApplication`
  ADD COLUMN `requestedUsername` VARCHAR(191) NULL,
  ADD COLUMN `passwordHash` VARCHAR(191) NULL;
