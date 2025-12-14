CREATE TABLE `cart` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`user_id` text(255) NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
CREATE TABLE `cartDiscounts` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`percentage` real DEFAULT 0 NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`description` text NOT NULL,
	`cart_id` text,
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text DEFAULT (current_timestamp),
	FOREIGN KEY (`cart_id`) REFERENCES `cart`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cartItems` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`cart_id` text,
	`type` text NOT NULL,
	`data` text,
	`price` real NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text DEFAULT (current_timestamp),
	FOREIGN KEY (`cart_id`) REFERENCES `cart`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
/*
 SQLite does not support "Set default to column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/