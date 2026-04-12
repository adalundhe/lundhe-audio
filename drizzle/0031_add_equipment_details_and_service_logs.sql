ALTER TABLE `equipment_item` ADD COLUMN `status` text NOT NULL DEFAULT 'active';
ALTER TABLE `equipment_item` ADD COLUMN `location` text NOT NULL DEFAULT '';
ALTER TABLE `equipment_item` ADD COLUMN `room` text NOT NULL DEFAULT '';
ALTER TABLE `equipment_item` ADD COLUMN `rack` text NOT NULL DEFAULT '';
ALTER TABLE `equipment_item` ADD COLUMN `shelf` text NOT NULL DEFAULT '';
ALTER TABLE `equipment_item` ADD COLUMN `slot` text NOT NULL DEFAULT '';
ALTER TABLE `equipment_item` ADD COLUMN `storage_case` text NOT NULL DEFAULT '';
ALTER TABLE `equipment_item` ADD COLUMN `notes` text NOT NULL DEFAULT '';

CREATE TABLE `equipment_service_log` (
  `id` text(255) PRIMARY KEY NOT NULL,
  `equipment_item_id` text(255) NOT NULL,
  `service_type` text(255) NOT NULL,
  `service_date` text NOT NULL,
  `warranty_until` text NOT NULL DEFAULT '',
  `notes` text NOT NULL DEFAULT '',
  `created_timestamp` text NOT NULL,
  `updated_timestamp` text DEFAULT (current_timestamp),
  FOREIGN KEY (`equipment_item_id`) REFERENCES `equipment_item`(`id`) ON DELETE CASCADE
);

CREATE INDEX `equipment_service_log_equipment_item_id_idx`
  ON `equipment_service_log` (`equipment_item_id`);

CREATE INDEX `equipment_service_log_service_date_idx`
  ON `equipment_service_log` (`service_date`);
