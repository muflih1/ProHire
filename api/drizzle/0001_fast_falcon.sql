ALTER TABLE "job_listings" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listings" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;