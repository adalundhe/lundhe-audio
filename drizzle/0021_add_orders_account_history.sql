CREATE TABLE `orders` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`user_id` text(255) NOT NULL,
	`checkout_session_id` text(255) NOT NULL,
	`payment_intent_id` text(255),
	`customer_email` text(255),
	`status` text NOT NULL,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`currency` text(16) DEFAULT 'usd' NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`item_count` integer DEFAULT 0 NOT NULL,
	`ordered_timestamp` text NOT NULL,
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_checkout_session_id_unique` ON `orders` (`checkout_session_id`);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`order_id` text(255) NOT NULL,
	`name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`total_price` real DEFAULT 0 NOT NULL,
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text DEFAULT (current_timestamp),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
