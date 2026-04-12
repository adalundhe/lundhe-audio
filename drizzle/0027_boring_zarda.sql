CREATE TABLE `coupons` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`code` text(64) NOT NULL,
	`redeemed` integer DEFAULT false NOT NULL,
	`redeemed_at` text,
	`redeemed_by_user_id` text(255),
	`created_timestamp` text NOT NULL,
	`updated_timestamp` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);
