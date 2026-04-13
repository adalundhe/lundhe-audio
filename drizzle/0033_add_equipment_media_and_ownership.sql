ALTER TABLE `equipment_item` ADD COLUMN `serial_number` text(255) DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `equipment_item` ADD COLUMN `acquired_from` text(255) DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `equipment_item` ADD COLUMN `purchase_date` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `equipment_item` ADD COLUMN `purchase_source` text(255) DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `equipment_item` ADD COLUMN `reference_number` text(255) DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE TABLE `equipment_item_media_asset` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`equipment_item_id` text(255) NOT NULL,
	`asset_type` text NOT NULL,
	`file_name` text(255) NOT NULL,
	`content_type` text(255) NOT NULL,
	`byte_size` integer NOT NULL,
	`storage_uri` text NOT NULL,
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text DEFAULT (current_timestamp),
	FOREIGN KEY (`equipment_item_id`) REFERENCES `equipment_item`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `equipment_item_media_asset_storage_uri_unique` ON `equipment_item_media_asset` (`storage_uri`);
--> statement-breakpoint
CREATE INDEX `equipment_item_media_asset_equipment_item_id_idx` ON `equipment_item_media_asset` (`equipment_item_id`);
--> statement-breakpoint
CREATE INDEX `equipment_item_media_asset_asset_type_idx` ON `equipment_item_media_asset` (`asset_type`);
--> statement-breakpoint
CREATE INDEX `equipment_item_media_asset_file_name_idx` ON `equipment_item_media_asset` (`file_name`);
