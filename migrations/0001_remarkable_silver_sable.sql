CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"spare_part_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"center_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"technician_id" uuid NOT NULL,
	"total_amount" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spare_parts_scrap" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"spare_part_id" uuid NOT NULL,
	"service_request_id" uuid,
	"technician_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spare_parts_shortages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"spare_part_id" uuid NOT NULL,
	"quantity_needed" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "warehouse_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permission_number" varchar(50) NOT NULL,
	"type" text NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"spare_part_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"reason" text NOT NULL,
	"requested_by" uuid NOT NULL,
	"approved_by" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"executed_at" timestamp,
	"executed_by" uuid,
	CONSTRAINT "warehouse_permissions_permission_number_unique" UNIQUE("permission_number")
);
--> statement-breakpoint
ALTER TABLE "parts_transfers" ADD COLUMN "transfer_number" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "parts_transfers" ADD CONSTRAINT "parts_transfers_transfer_number_unique" UNIQUE("transfer_number");