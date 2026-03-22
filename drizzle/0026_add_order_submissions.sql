CREATE TABLE `submissions` (
  `id` text(255) PRIMARY KEY NOT NULL,
  `order_id` text(255) NOT NULL,
  `user_id` text(255) NOT NULL,
  `upload_bucket_key` text(255) NOT NULL,
  `download_bucket_key` text(255),
  `submitted_at` text NOT NULL,
  `created_timestamp` text NOT NULL,
  `updated_timestamp` text DEFAULT (current_timestamp),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `submissions_upload_bucket_key_unique`
ON `submissions` (`upload_bucket_key`);
--> statement-breakpoint
CREATE UNIQUE INDEX `submissions_download_bucket_key_unique`
ON `submissions` (`download_bucket_key`);
--> statement-breakpoint
CREATE INDEX `submissions_order_id_idx`
ON `submissions` (`order_id`);
--> statement-breakpoint
CREATE INDEX `submissions_user_id_idx`
ON `submissions` (`user_id`);
--> statement-breakpoint
CREATE INDEX `submissions_submitted_at_idx`
ON `submissions` (`submitted_at`);
