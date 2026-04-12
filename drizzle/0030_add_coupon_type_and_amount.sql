ALTER TABLE `coupons` ADD COLUMN `coupon_type` text NOT NULL DEFAULT 'flat';
--> statement-breakpoint
ALTER TABLE `coupons` ADD COLUMN `amount` real NOT NULL DEFAULT 0;
