CREATE TABLE `order_song_specs` (
  `id` text(255) PRIMARY KEY NOT NULL,
  `order_id` text(255) NOT NULL,
  `session_name` text NOT NULL,
  `song_index` integer NOT NULL,
  `title` text NOT NULL,
  `service_type` text NOT NULL,
  `source_type` text NOT NULL,
  `expected_duration_seconds` real,
  `duration_tolerance_seconds` real DEFAULT 2 NOT NULL,
  `expected_source_count` integer,
  `expected_track_count` integer,
  `expected_stem_count` integer,
  `allowed_sample_rates` text DEFAULT '[]' NOT NULL,
  `allowed_bit_depths` text DEFAULT '[24,32,64]' NOT NULL,
  `requirements` text DEFAULT '[]' NOT NULL,
  `created_timestamp` text NOT NULL,
  `updated_timestamp` text DEFAULT (current_timestamp),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `order_song_specs_order_id_idx` ON `order_song_specs` (`order_id`);
--> statement-breakpoint
CREATE TABLE `order_song_assets` (
  `id` text(255) PRIMARY KEY NOT NULL,
  `order_id` text(255) NOT NULL,
  `song_spec_id` text(255) NOT NULL,
  `asset_kind` text NOT NULL,
  `validation_status` text DEFAULT 'valid' NOT NULL,
  `file_name` text NOT NULL,
  `original_relative_path` text,
  `public_path` text NOT NULL,
  `mime_type` text,
  `byte_size` integer DEFAULT 0 NOT NULL,
  `duration_seconds` real,
  `sample_rate_hz` integer,
  `bit_depth` integer,
  `channel_count` integer,
  `validation_messages` text DEFAULT '[]' NOT NULL,
  `uploaded_timestamp` text NOT NULL,
  `created_timestamp` text NOT NULL,
  `updated_timestamp` text DEFAULT (current_timestamp),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`song_spec_id`) REFERENCES `order_song_specs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `order_song_assets_order_id_idx` ON `order_song_assets` (`order_id`);
--> statement-breakpoint
CREATE INDEX `order_song_assets_song_spec_id_idx` ON `order_song_assets` (`song_spec_id`);
