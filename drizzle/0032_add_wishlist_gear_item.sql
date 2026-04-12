CREATE TABLE `wishlist_gear_item` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`description` text(255) NOT NULL,
	`type` text(255) NOT NULL,
	`group` text(255) NOT NULL,
	`status` text DEFAULT 'watching' NOT NULL,
	`target_price` real DEFAULT 0 NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`manufacturer` text(255) NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
CREATE INDEX `wishlist_gear_item_name_idx` ON `wishlist_gear_item` (`name`);
--> statement-breakpoint
CREATE INDEX `wishlist_gear_item_status_idx` ON `wishlist_gear_item` (`status`);
--> statement-breakpoint
CREATE INDEX `wishlist_gear_item_type_idx` ON `wishlist_gear_item` (`type`);
--> statement-breakpoint
CREATE INDEX `wishlist_gear_item_manufacturer_idx` ON `wishlist_gear_item` (`manufacturer`);
