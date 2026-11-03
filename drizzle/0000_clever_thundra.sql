CREATE TABLE `prompt_reports` (
	`prompt_id` text NOT NULL,
	`client_id` text NOT NULL,
	`reason` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`prompt_id`, `client_id`)
);
--> statement-breakpoint
CREATE TABLE `prompt_votes` (
	`prompt_id` text NOT NULL,
	`client_id` text NOT NULL,
	`vote` text NOT NULL,
	PRIMARY KEY(`prompt_id`, `client_id`)
);
--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`kind` text NOT NULL,
	`author_id` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`scope` text PRIMARY KEY NOT NULL,
	`bucket` integer NOT NULL,
	`hits` integer NOT NULL,
	`updated_at` integer NOT NULL
);
