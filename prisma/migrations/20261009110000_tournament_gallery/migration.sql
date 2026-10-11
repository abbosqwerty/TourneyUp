-- Extra poster frames are used only in the feed carousel. The tournament
-- detail page deliberately continues to use the primary poster.
ALTER TABLE `Tournament` ADD COLUMN `galleryMediaIdsJson` TEXT NULL;
