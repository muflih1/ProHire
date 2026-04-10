CREATE TABLE "external_accounts" (
	"id" bigint PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"approved_scopes" text,
	"username" text,
	"first_name" text,
	"last_name" text,
	"email_address" text,
	"email_address_verified" boolean,
	"avatar_url" text,
	"phone_number" text,
	"user_id" bigint NOT NULL,
	"id_token" text,
	"access_token" text,
	"referesh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"key" varchar(64) NOT NULL,
	"description" text,
	"publicly_visible" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "features_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "job_listing_applications" (
	"id" bigint PRIMARY KEY NOT NULL,
	"job_listing_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"cover_letter" varchar(400),
	"rating" integer,
	"stage" varchar(50) DEFAULT 'APPLIED',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_listing_skills" (
	"skill_id" bigint NOT NULL,
	"job_listing_id" bigint NOT NULL,
	CONSTRAINT "job_listing_skills_skill_id_job_listing_id_pk" PRIMARY KEY("skill_id","job_listing_id")
);
--> statement-breakpoint
CREATE TABLE "job_listings" (
	"id" bigint PRIMARY KEY NOT NULL,
	"organization_id" bigint NOT NULL,
	"title" varchar(140) NOT NULL,
	"description" text NOT NULL,
	"wage_in_paise" integer,
	"wage_interval" varchar(50),
	"street_address" varchar(255),
	"location_requirement" varchar(50) NOT NULL,
	"experience_level" varchar(50),
	"openings" integer NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT',
	"type" varchar(50),
	"postedAt" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" bigint PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"organization_id" bigint NOT NULL,
	"role_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_payments" (
	"id" bigint PRIMARY KEY NOT NULL,
	"subscription_id" bigint NOT NULL,
	"stripe_payment_intent_id" text,
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"status" varchar(50) NOT NULL,
	"provider" varchar(50) DEFAULT 'STRIPE',
	"provider_id" varchar(255),
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_subscriptions" (
	"id" bigint PRIMARY KEY NOT NULL,
	"organization_id" bigint NOT NULL,
	"plan_id" bigint NOT NULL,
	"plan_period" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp with time zone,
	"past_due_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" text NOT NULL,
	"profile_image_storage_key" text,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" bigint PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "plan_features" (
	"id" bigint PRIMARY KEY NOT NULL,
	"plan_id" bigint NOT NULL,
	"feature_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"key" varchar(64) NOT NULL,
	"description" text,
	"amount_in_paise" integer NOT NULL,
	"annual_monthly_amount_in_paise" integer,
	"annual_amount" integer GENERATED ALWAYS AS ("plans"."annual_monthly_amount_in_paise" * 12) STORED,
	"publicly_visible" boolean DEFAULT true,
	"currency" text DEFAULT 'INR' NOT NULL,
	"is_recurring" boolean DEFAULT true NOT NULL,
	"free_trial_enabled" boolean DEFAULT false NOT NULL,
	"free_trial_days" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "plans_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" bigint PRIMARY KEY NOT NULL,
	"role_id" bigint NOT NULL,
	"permission_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" smallint NOT NULL,
	"rotating_token_digest" "bytea" NOT NULL,
	"user_id" bigint NOT NULL,
	"user_agnet" text,
	"ip_address" "inet",
	"status" text DEFAULT 'active' NOT NULL,
	"last_active_organization_id" bigint,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_rotated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created" bigint NOT NULL,
	CONSTRAINT "sessions_id_user_id_created_pk" PRIMARY KEY("id","user_id","created")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "skills_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_resumes" (
	"id" bigint PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"file_storage_key" varchar(255) NOT NULL,
	"summury" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_resumes_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"first_name" varchar(40) NOT NULL,
	"last_name" varchar(40) NOT NULL,
	"email_address" text NOT NULL,
	"password_digest" text,
	"profile_image_storage_key" text,
	"locale" text,
	"last_sign_in_at" timestamp DEFAULT now() NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_address_unique" UNIQUE("email_address")
);
--> statement-breakpoint
ALTER TABLE "external_accounts" ADD CONSTRAINT "external_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listing_applications" ADD CONSTRAINT "job_listing_applications_job_listing_id_job_listings_id_fk" FOREIGN KEY ("job_listing_id") REFERENCES "public"."job_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listing_applications" ADD CONSTRAINT "job_listing_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listing_skills" ADD CONSTRAINT "job_listing_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listing_skills" ADD CONSTRAINT "job_listing_skills_job_listing_id_job_listings_id_fk" FOREIGN KEY ("job_listing_id") REFERENCES "public"."job_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_payments" ADD CONSTRAINT "organization_payments_subscription_id_organization_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."organization_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_last_active_organization_id_organizations_id_fk" FOREIGN KEY ("last_active_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_resumes" ADD CONSTRAINT "user_resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "external_accounts_user_id_index" ON "external_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_accounts_provider_provider_user_id_index" ON "external_accounts" USING btree ("provider","provider_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_listing_applications_job_listing_id_user_id_index" ON "job_listing_applications" USING btree ("job_listing_id","user_id");--> statement-breakpoint
CREATE INDEX "job_listing_applications_user_id_index" ON "job_listing_applications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_subscriptions_organization_id_index" ON "organization_subscriptions" USING btree ("organization_id") WHERE "organization_subscriptions"."status" = 'active';--> statement-breakpoint
CREATE INDEX "organizations_stripe_customer_id_index" ON "organizations" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_features_plan_id_feature_id_index" ON "plan_features" USING btree ("plan_id","feature_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_is_default_index" ON "plans" USING btree ("is_default") WHERE "plans"."is_default" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_index" ON "role_permissions" USING btree ("role_id","permission_id");