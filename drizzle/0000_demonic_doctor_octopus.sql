CREATE TABLE `ContactRequestor` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`email` text(255) NOT NULL,
	`phone` text(64) NOT NULL,
	`service` text(64) NOT NULL,
	`sms_accepted` text(64) NOT NULL,
	`created_timestamp` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `EquipmentItem` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`description` text(255) NOT NULL,
	`type` text(255) NOT NULL,
	`group` text(255) NOT NULL,
	`quantity` integer NOT NULL,
	`created_timestamp` text NOT NULL
);
