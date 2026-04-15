CREATE TABLE `gear_manifest` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`part_count` integer DEFAULT 1 NOT NULL,
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
CREATE INDEX `gear_manifest_name_idx` ON `gear_manifest` (`name`);
--> statement-breakpoint
CREATE INDEX `gear_manifest_created_timestamp_idx` ON `gear_manifest` (`created_timestamp`);
--> statement-breakpoint
CREATE TABLE `gear_manifest_entry` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`manifest_id` text(255) NOT NULL,
	`equipment_item_id` text(255) NOT NULL,
	`item_order` integer DEFAULT 0 NOT NULL,
	`item_name` text(255) NOT NULL,
	`manufacturer` text(255) NOT NULL,
	`type` text(255) NOT NULL,
	`group` text(255) NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text DEFAULT (current_timestamp),
	FOREIGN KEY (`manifest_id`) REFERENCES `gear_manifest`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`equipment_item_id`) REFERENCES `equipment_item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `gear_manifest_entry_manifest_id_idx` ON `gear_manifest_entry` (`manifest_id`);
--> statement-breakpoint
CREATE INDEX `gear_manifest_entry_equipment_item_id_idx` ON `gear_manifest_entry` (`equipment_item_id`);
--> statement-breakpoint
CREATE INDEX `gear_manifest_entry_item_order_idx` ON `gear_manifest_entry` (`item_order`);
