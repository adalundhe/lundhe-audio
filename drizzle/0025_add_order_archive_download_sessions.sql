CREATE TABLE `order_archive_download_sessions` (
  `id` text(255) PRIMARY KEY NOT NULL,
  `order_id` text(255) NOT NULL,
  `user_id` text(255) NOT NULL,
  `token` text(255) NOT NULL,
  `asset_ids` text DEFAULT '[]' NOT NULL,
  `expires_at` text NOT NULL,
  `revoked_at` text,
  `created_timestamp` text NOT NULL,
  `updated_timestamp` text DEFAULT (current_timestamp),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_archive_download_sessions_token_unique`
ON `order_archive_download_sessions` (`token`);
--> statement-breakpoint
CREATE INDEX `order_archive_download_sessions_order_id_idx`
ON `order_archive_download_sessions` (`order_id`);
--> statement-breakpoint
CREATE INDEX `order_archive_download_sessions_user_id_idx`
ON `order_archive_download_sessions` (`user_id`);
