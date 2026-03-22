ALTER TABLE `orders` ADD `workflow_status` text DEFAULT 'awaiting-files' NOT NULL;
--> statement-breakpoint
UPDATE `orders`
SET `workflow_status` = CASE
  WHEN `status` = 'expired' THEN 'cancelled'
  WHEN `payment_status` IN ('paid', 'no_payment_required') THEN 'awaiting-files'
  ELSE 'on-hold'
END;
