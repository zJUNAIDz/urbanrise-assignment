CREATE TABLE `visits` (
	`visit_id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`project` text NOT NULL,
	`config` text NOT NULL,
	`visit_at` text NOT NULL,
	`executive` text NOT NULL,
	`outcome` text DEFAULT '' NOT NULL,
	`next_action` text DEFAULT '' NOT NULL
);
