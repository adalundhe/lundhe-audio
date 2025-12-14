ALTER TABLE `ContactRequestor` RENAME TO `contact_requestor`;--> statement-breakpoint
ALTER TABLE `EquipmentItem` RENAME TO `equipment_item`;--> statement-breakpoint
DROP INDEX IF EXISTS `EquipmentItem_name_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `equipment_item_name_unique` ON `equipment_item` (`name`);