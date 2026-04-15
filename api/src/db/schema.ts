import {relations, SQL, sql} from 'drizzle-orm';
import {
  customType,
  bigint,
  index,
  inet,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
  text,
  integer,
  primaryKey,
  boolean,
  smallint,
} from 'drizzle-orm/pg-core';

class Snowflake {
  private static _instance: Snowflake;
  private _epoch: number;
  private _shardId: number;
  private _sequence: bigint;
  private _lastTimestamp: number;

  static getInstance() {
    if (!Snowflake._instance) {
      Snowflake._instance = new Snowflake();
    }
    return Snowflake._instance;
  }

  constructor(shardId = 0, epoch = 1759909758646) {
    this._epoch = epoch;
    this._shardId = shardId;
    this._sequence = 0n;
    this._lastTimestamp = -1;
  }

  private _now() {
    return Date.now();
  }

  private _wait(lastTimestamp: number) {
    let timestamp = this._now();
    while (timestamp <= lastTimestamp) {
      timestamp = this._now();
    }
    return timestamp;
  }

  nextId() {
    let timestamp = this._now();
    if (timestamp === this._lastTimestamp) {
      this._sequence = (this._sequence + 1n) & 4095n;
      if (this._sequence === 0n) {
        timestamp = this._wait(this._lastTimestamp);
      }
    } else {
      this._sequence = 0n;
    }
    this._lastTimestamp = timestamp;

    const timestampPart = BigInt(timestamp - this._epoch) << 22n;
    const shardPart = BigInt(this._shardId) << 12n;
    const sequencePart = BigInt(this._sequence);

    return timestampPart | shardPart | sequencePart;
  }
}

const snowflake = Snowflake.getInstance();

export const bytea = customType<{data: Buffer<ArrayBuffer>}>({
  dataType() {
    return 'bytea';
  },
});

export const usersTable = pgTable('users', {
  id: bigint({mode: 'bigint'})
    .primaryKey()
    .$defaultFn(() => snowflake.nextId()),
  firstName: varchar('first_name', {length: 40}).notNull(),
  lastName: varchar('last_name', {length: 40}).notNull(),
  emailAddress: text('email_address').notNull().unique(),
  passwordDigest: text('password_digest'),
  profileImageStorageKey: text('profile_image_storage_key'),
  locale: text('locale'),
  lastSignInAt: timestamp('last_sign_in_at').notNull().defaultNow(),
  banned: boolean('banned').notNull().default(false),
  locked: boolean('locked').notNull().default(false),
  createdAt: timestamp('created_at', {precision: 6, withTimezone: true})
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersRelations = relations(usersTable, ({many}) => ({
  external_accounts: many(externalAccountsTable),
  sessions: many(sessionsTable),
  organization_memberships: many(organizationMembershipsTable),
}));

export const externalAccountsTable = pgTable(
  'external_accounts',
  {
    id: bigint({mode: 'bigint'})
      .primaryKey()
      .$defaultFn(() => snowflake.nextId()),
    provider: text('provider', {
      enum: [
        'oauth_google',
        'oauth_github',
        'oauth_facebook',
        'oauth_microsoft',
      ],
    }).notNull(),
    providerUserID: text('provider_user_id').notNull(),
    approvedScopes: text('approved_scopes'),
    username: text('username'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    emailAddress: text('email_address'),
    emailAddressVerified: boolean('email_address_verified'),
    avatarURL: text('avatar_url'),
    phoneNumber: text('phone_number'),
    userID: bigint('user_id', {mode: 'bigint'})
      .notNull()
      .references(() => usersTable.id, {onDelete: 'cascade'}),
    idToken: text('id_token'),
    accessToken: text('access_token'),
    refereshToken: text('referesh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    createdAt: timestamp('created_at', {precision: 6, withTimezone: true})
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  t => [index().on(t.userID), uniqueIndex().on(t.provider, t.providerUserID)],
);

export const externalAccountsRelations = relations(
  externalAccountsTable,
  ({one}) => ({
    user: one(usersTable, {
      fields: [externalAccountsTable.userID],
      references: [usersTable.id],
    }),
  }),
);

export const sessionsTable = pgTable(
  'sessions',
  {
    id: smallint('id').notNull(),
    rotatingTokenDigest: bytea('rotating_token_digest').notNull(),
    userID: bigint('user_id', {mode: 'bigint'})
      .notNull()
      .references(() => usersTable.id, {onDelete: 'cascade'}),
    userAgent: text('user_agnet'),
    ipAddress: inet('ip_address'),
    status: text('status').notNull().default('active'),
    lastActiveOrganizationID: bigint('last_active_organization_id', {
      mode: 'bigint',
    }).references(() => organizationsTable.id, {onDelete: 'set null'}),
    lastActiveAt: timestamp('last_active_at', {withTimezone: true})
      .notNull()
      .defaultNow(),
    lastRotatedAt: timestamp('last_rotated_at', {withTimezone: true})
      .notNull()
      .defaultNow(),
    created: bigint('created', {mode: 'number'})
      .notNull()
      .$default(() => Math.floor(Date.now() / 1000)),
  },
  t => [primaryKey({columns: [t.id, t.userID, t.created]})],
);

export const sessionsRelations = relations(sessionsTable, ({one, many}) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userID],
    references: [usersTable.id],
  }),
  lastActiveOrganization: one(organizationsTable, {
    fields: [sessionsTable.lastActiveOrganizationID],
    references: [organizationsTable.id],
  }),
}));

export const rolesTable = pgTable('roles', {
  id: bigint({mode: 'bigint'})
    .primaryKey()
    .$defaultFn(() => snowflake.nextId()),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', {precision: 6, withTimezone: true})
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const rolesRelations = relations(rolesTable, ({many}) => ({
  role_permissions: many(rolePermissionsTable),
}));

export const permissionsTable = pgTable('permissions', {
  id: bigint({mode: 'bigint'})
    .primaryKey()
    .$defaultFn(() => snowflake.nextId()),
  key: varchar('key', {length: 64}).notNull().unique(),
  createdAt: timestamp('created_at', {precision: 6, withTimezone: true})
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const permissionsRelations = relations(permissionsTable, ({many}) => ({
  rolePermissions: many(rolePermissionsTable),
}));

export const rolePermissionsTable = pgTable(
  'role_permissions',
  {
    id: bigint({mode: 'bigint'})
      .primaryKey()
      .$defaultFn(() => snowflake.nextId()),
    roleID: bigint('role_id', {mode: 'bigint'})
      .notNull()
      .references(() => rolesTable.id, {onDelete: 'cascade'}),
    permissionID: bigint('permission_id', {mode: 'bigint'})
      .notNull()
      .references(() => permissionsTable.id, {onDelete: 'cascade'}),
    createdAt: timestamp('created_at', {precision: 6, withTimezone: true})
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  t => [uniqueIndex().on(t.roleID, t.permissionID)],
);

export const rolePermissionsRelations = relations(
  rolePermissionsTable,
  ({one}) => ({
    role: one(rolesTable, {
      fields: [rolePermissionsTable.roleID],
      references: [rolesTable.id],
    }),
    permission: one(permissionsTable, {
      fields: [rolePermissionsTable.permissionID],
      references: [permissionsTable.id],
    }),
  }),
);

export const organizationsTable = pgTable(
  'organizations',
  {
    id: bigint({mode: 'bigint'})
      .primaryKey()
      .$defaultFn(() => snowflake.nextId()),
    name: varchar('name', {length: 80}).notNull(),
    slug: text('slug').notNull().unique(),
    profileImageStorageKey: text('profile_image_storage_key'),
    stripeCustomerID: text('stripe_customer_id'),
    createdAt: timestamp('created_at', {precision: 6, withTimezone: true})
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  t => [index().on(t.stripeCustomerID)],
);

export const organizationsRelations = relations(
  organizationsTable,
  ({many}) => ({
    organizationMemberships: many(organizationMembershipsTable),
  }),
);

export const organizationMembershipsTable = pgTable(
  'organization_memberships',
  {
    id: bigint({mode: 'bigint'})
      .primaryKey()
      .$defaultFn(() => snowflake.nextId()),
    userID: bigint('user_id', {mode: 'bigint'})
      .notNull()
      .references(() => usersTable.id, {onDelete: 'cascade'}),
    organizationID: bigint('organization_id', {mode: 'bigint'})
      .notNull()
      .references(() => organizationsTable.id, {onDelete: 'cascade'}),
    roleID: bigint('role_id', {mode: 'bigint'})
      .notNull()
      .references(() => rolesTable.id, {onDelete: 'set default'}),
    createdAt: timestamp('created_at', {precision: 6, withTimezone: true})
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
);

export const organizationMembershipsRelations = relations(
  organizationMembershipsTable,
  ({many, one}) => ({
    user: one(usersTable, {
      fields: [organizationMembershipsTable.userID],
      references: [usersTable.id],
    }),
    organization: one(organizationsTable, {
      fields: [organizationMembershipsTable.organizationID],
      references: [organizationsTable.id],
    }),
    role: one(rolesTable, {
      fields: [organizationMembershipsTable.roleID],
      references: [rolesTable.id],
    }),
  }),
);

export const jobListingStatusEnum = ['DRAFT', 'PUBLISHED', 'UNLISTED'] as const;
export type JobListingStatus = (typeof jobListingStatusEnum)[number];

export const jobListingsTable = pgTable('job_listings', {
  id: bigint({mode: 'bigint'})
    .primaryKey()
    .$defaultFn(() => snowflake.nextId()),
  organizationID: bigint('organization_id', {mode: 'bigint'})
    .notNull()
    .references(() => organizationsTable.id, {onDelete: 'cascade'}),
  title: varchar({length: 140}).notNull(),
  description: text().notNull(),
  wageInPaise: integer('wage_in_paise'),
  wageInterval: varchar('wage_interval', {length: 50}),
  streetAddress: varchar('street_address', {length: 255}),
  locationRequirement: varchar('location_requirement', {length: 50}).notNull(),
  experienceLevel: varchar('experience_level', {length: 50}),
  openings: integer().notNull(),
  status: varchar({length: 50, enum: jobListingStatusEnum})
    .notNull()
    .default('DRAFT'),
  type: varchar({length: 50}),
  isFeatured: boolean('is_featured').notNull().default(false),
  postedAt: timestamp({withTimezone: true}),
  createdAt: timestamp('created_at', {precision: 6, withTimezone: true})
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const skillsTable = pgTable('skills', {
  id: bigint({mode: 'bigint'})
    .primaryKey()
    .$defaultFn(() => snowflake.nextId()),
  name: varchar({length: 100}).notNull().unique(),
  description: text(),
  createdAt: timestamp('created_at', {
    precision: 6,
    withTimezone: true,
  }).defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const jobListingSkillsTable = pgTable(
  'job_listing_skills',
  {
    skillID: bigint('skill_id', {mode: 'bigint'})
      .notNull()
      .references(() => skillsTable.id, {onDelete: 'cascade'}),
    jobListingID: bigint('job_listing_id', {mode: 'bigint'})
      .notNull()
      .references(() => jobListingsTable.id, {onDelete: 'cascade'}),
  },
  t => [primaryKey({columns: [t.skillID, t.jobListingID]})],
);

export const jobListingApplicationsTable = pgTable(
  'job_listing_applications',
  {
    id: bigint({mode: 'bigint'})
      .primaryKey()
      .$default(() => snowflake.nextId()),
    jobListingID: bigint('job_listing_id', {mode: 'bigint'})
      .notNull()
      .references(() => jobListingsTable.id, {onDelete: 'cascade'}),
    userID: bigint('user_id', {mode: 'bigint'})
      .notNull()
      .references(() => usersTable.id, {onDelete: 'cascade'}),
    coverLetter: varchar('cover_letter', {length: 400}),
    rating: integer(),
    stage: varchar({length: 50}).default('APPLIED'),
    createdAt: timestamp('created_at', {precision: 6, withTimezone: true})
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  t => [uniqueIndex().on(t.jobListingID, t.userID), index().on(t.userID)],
);

export const userResumesTable = pgTable('user_resumes', {
  id: bigint({mode: 'bigint'})
    .primaryKey()
    .$default(() => snowflake.nextId()),
  userID: bigint('user_id', {mode: 'bigint'})
    .notNull()
    .unique()
    .references(() => usersTable.id, {onDelete: 'cascade'}),
  fileStorageKey: varchar('file_storage_key', {length: 255}).notNull(),
  summury: text(),
  createdAt: timestamp('created_at', {precision: 6, withTimezone: true})
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const plansTable = pgTable(
  'plans',
  {
    id: bigint({mode: 'bigint'})
      .primaryKey()
      .$default(() => snowflake.nextId()),
    name: varchar({length: 100}).notNull(),
    key: varchar('key', {length: 64}).notNull().unique(),
    description: text('description'),
    amountInPaise: integer('amount_in_paise').notNull(),
    annualMonthlyAmountInPaise: integer('annual_monthly_amount_in_paise'),
    annualAmount: integer('annual_amount').generatedAlwaysAs(
      (): SQL => sql`${plansTable.annualMonthlyAmountInPaise} * 12`,
    ),
    publiclyVisible: boolean('publicly_visible').default(true),
    currency: text('currency').notNull().default('INR'),
    isRecurring: boolean('is_recurring').notNull().default(true),
    freeTrialEnabled: boolean('free_trial_enabled').notNull().default(false),
    freeTrialDays: integer('free_trial_days'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  t => [
    uniqueIndex()
      .on(t.isDefault)
      .where(sql`${t.isDefault} = true`),
  ],
);

export const featuresTable = pgTable('features', {
  id: bigint({mode: 'bigint'})
    .primaryKey()
    .$default(() => snowflake.nextId()),
  name: varchar('name', {length: 100}).notNull(),
  key: varchar('key', {length: 64}).notNull().unique(),
  description: text('description'),
  publiclyVisible: boolean('publicly_visible').default(true),
  createdAt: timestamp('created_at', {
    precision: 6,
    withTimezone: true,
  }).defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const planFeaturesTable = pgTable(
  'plan_features',
  {
    id: bigint({mode: 'bigint'})
      .primaryKey()
      .$default(() => snowflake.nextId()),
    planID: bigint('plan_id', {mode: 'bigint'})
      .notNull()
      .references(() => plansTable.id, {onDelete: 'cascade'}),
    featureID: bigint('feature_id', {mode: 'bigint'})
      .notNull()
      .references(() => featuresTable.id, {onDelete: 'cascade'}),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  t => [uniqueIndex().on(t.planID, t.featureID)],
);

export const organizationSubscriptionsTable = pgTable(
  'organization_subscriptions',
  {
    id: bigint({mode: 'bigint'})
      .primaryKey()
      .$default(() => snowflake.nextId()),
    organizationID: bigint('organization_id', {mode: 'bigint'})
      .notNull()
      .references(() => organizationsTable.id, {onDelete: 'cascade'}),
    planID: bigint('plan_id', {mode: 'bigint'})
      .notNull()
      .references(() => plansTable.id),
    planPeriod: text('plan_period', {enum: ['monthly', 'annual']}).notNull(),
    amount: integer('amount').notNull(),
    currency: text('currency').notNull().default('INR'),
    status: text('status', {
      enum: ['upcoming', 'active', 'trialing', 'past_due', 'canceled', 'ended'],
    }).notNull(),
    currentPeriodStart: timestamp('current_period_start', {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp('current_period_end', {
      withTimezone: true,
    }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    canceledAt: timestamp('canceled_at', {withTimezone: true}),
    pastDueAt: timestamp('past_due_at', {withTimezone: true}),
    endedAt: timestamp('ended_at', {withTimezone: true}),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  t => [
    uniqueIndex()
      .on(t.organizationID)
      .where(sql`${t.status} = 'active'`),
  ],
);

export const organizationPaymentsTable = pgTable('organization_payments', {
  id: bigint({mode: 'bigint'})
    .primaryKey()
    .$default(() => snowflake.nextId()),
  subscriptionID: bigint('subscription_id', {mode: 'bigint'})
    .notNull()
    .references(() => organizationSubscriptionsTable.id, {
      onDelete: 'cascade',
    }),
  stripePaymentIntentID: text('stripe_payment_intent_id'),
  amount: integer('amount').notNull(),
  currency: varchar('currency', {length: 10}).notNull().default('INR'),
  status: varchar('status', {
    length: 50,
    enum: ['pending', 'paid', 'failed'],
  }).notNull(),
  provider: varchar('provider', {length: 50}).default('STRIPE'),
  providerID: varchar('provider_id', {length: 255}),
  paidAt: timestamp('paid_at', {withTimezone: true}),
  createdAt: timestamp('created_at', {
    precision: 6,
    withTimezone: true,
  }).defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .defaultNow()
    .$onUpdate(() => new Date()),
});
