CREATE TABLE `discounts` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`discount_percentage` real NOT NULL,
	`category` text NOT NULL,
	`min_threshold` integer,
	`max_threshold` integer,
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text
);
--> statement-breakpoint
CREATE TABLE `product_options` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real NOT NULL,
	`category` text NOT NULL,
	`price_type` text NOT NULL,
	`min_threshold` integer,
	`max_threshold` integer,
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real NOT NULL,
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text
);
