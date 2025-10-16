import { sql } from "drizzle-orm";
import { customType, bigint, index, inet, pgTable, timestamp, uniqueIndex, varchar, text, integer, boolean, primaryKey } from "drizzle-orm/pg-core";

class Snowflake {
  private static _instance: Snowflake
  private _epoch: number
  private _shardId: number
  private _sequence: bigint
  private _lastTimestamp: number

  static getInstance() {
    if (!Snowflake._instance) {
      Snowflake._instance = new Snowflake()
    }
    return Snowflake._instance
  }

  constructor(shardId = 0, epoch = 1759909758646) {
    this._epoch = epoch
    this._shardId = shardId
    this._sequence = 0n
    this._lastTimestamp = -1
  }

  private _now() {
    return Date.now()
  }

  private _wait(lastTimestamp: number) {
    let timestamp = this._now()
    while (timestamp <= lastTimestamp) {
      timestamp = this._now()
    }
    return timestamp
  }

  nextId() {
    let timestamp = this._now()
    if (timestamp === this._lastTimestamp) {
      this._sequence = (this._sequence + 1n) & 4095n
      if (this._sequence === 0n) {
        timestamp = this._wait(this._lastTimestamp)
      }
    } else {
      this._sequence = 0n
    }
    this._lastTimestamp = timestamp

    const timestampPart = BigInt(timestamp - this._epoch) << 22n
    const shardPart = BigInt(this._shardId) << 12n
    const sequencePart = BigInt(this._sequence)

    return timestampPart | shardPart | sequencePart
  }

}

const snowflake = Snowflake.getInstance()

export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea"
  }
})

export const usersTable = pgTable("users", {
  id: bigint({ mode: 'bigint' }).primaryKey().$default(() => snowflake.nextId()),
  displayName: varchar("display_name", { length: 50 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  imageURL: varchar('image_url', { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
})

export const sessionsTable = pgTable("sessions", {
  id: bigint({ mode: 'bigint' }).primaryKey().$default(() => snowflake.nextId()),
  userID: bigint("user_id", { mode: "bigint" }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  secret: bytea().notNull().unique(),
  ipAddress: inet("ip_address"),
  userAgent: varchar('user_agent', { length: 255 }),
  expiresAt: timestamp("expires_at").notNull().$default(() => new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, t => ([
  index().on(t.userID),
]))

export const accountsTable = pgTable("accounts", {
  id: bigint({ mode: 'bigint' }).primaryKey().$default(() => snowflake.nextId()),
  userID: bigint("user_id", { mode: "bigint" }).references(() => usersTable.id, { onDelete: "cascade" }),
  accountID: varchar("account_id", { length: 255 }).notNull(),
  provider: varchar({ length: 50 }).notNull(),
  accessToken: varchar("access_token", { length: 255 }),
  refreshToken: varchar("refresh_token", { length: 255 }),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: varchar({ length: 255 }),
  password: varchar({ length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
}, t => ([
  uniqueIndex().on(t.provider, t.accessToken)
]))

export const organizationsTable = pgTable('organizations', {
  id: bigint({ mode: "bigint" }).primaryKey().$default(() => snowflake.nextId()),
  name: varchar({ length: 50 }).notNull(),
  imageURL: varchar('image_url', { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
})

export const rolesTable = pgTable('roles', {
  id: bigint({ mode: 'bigint' }).primaryKey().$default(() => snowflake.nextId()),
  name: varchar({ length: 50 }).notNull(),
  organizationID: bigint('organization_id', { mode: 'bigint' }).notNull().references(() => organizationsTable.id, { onDelete: 'cascade' }),
  description: text(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
}, t => [uniqueIndex().on(t.name, t.organizationID)])

export const permissionsTable = pgTable('permissions', {
  id: bigint({ mode: 'bigint' }).primaryKey().$default(() => snowflake.nextId()),
  name: varchar({ length: 255 }).unique().notNull(),
  description: text(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
})

export const rolePermissionsTable = pgTable('role_permissions', {
  id: bigint({ mode: 'bigint' }).primaryKey().$default(() => snowflake.nextId()),
  roleID: bigint('role_id', { mode: "bigint" }).notNull().references(() => rolesTable.id, { onDelete: 'cascade' }),
  permissionID: bigint('permission_id', { mode: 'bigint' }).notNull().references(() => permissionsTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
}, t => [uniqueIndex().on(t.roleID, t.permissionID)])

export const membersTable = pgTable('members', {
  id: bigint({ mode: "bigint" }).primaryKey().$default(() => snowflake.nextId()),
  organizationID: bigint("organization_id", { mode: "bigint" }).notNull().references(() => organizationsTable.id, { onDelete: 'cascade' }),
  userID: bigint('user_id', { mode: "bigint" }).notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  roleID: bigint('role_id', { mode: 'bigint' }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
})

export const jobListingsTable = pgTable('job_listings', {
  id: bigint({ mode: "bigint" }).primaryKey().$defaultFn(() => snowflake.nextId()),
  organizationID: bigint("organization_id", { mode: "bigint" }).notNull().references(() => organizationsTable.id, { onDelete: 'cascade' }),
  title: varchar({ length: 140 }).notNull(),
  description: text().notNull(),
  wage: integer().notNull(),
  wageInterval: varchar('wage_interval', { length: 50 }),
  streetAddress: varchar('street_address', { length: 255 }),
  locationRequirement: varchar("location_requirement", { length: 50 }).notNull(),
  experienceLevel: varchar("experience_level", { length: 50 }),
  openings: integer().notNull(),
  status: varchar({ length: 50 }).default("DRAFT"),
  type: varchar({ length: 50 }),
  postedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
})

export const skillsTable = pgTable('skills', {
  id: bigint({ mode: "bigint" }).primaryKey().$defaultFn(() => snowflake.nextId()),
  name: varchar({ length: 100 }).notNull().unique(),
  description: text(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdate(() => new Date())
})

export const jobListingSkillsTable = pgTable('job_listing_skills', {
  skillID: bigint('skill_id', { mode: 'bigint' }).notNull().references(() => skillsTable.id, { onDelete: 'cascade' }),
  jobListingID: bigint('job_listing_id', { mode: 'bigint' }).notNull().references(() => jobListingsTable.id, { onDelete: 'cascade' })
}, t => [primaryKey({ columns: [t.skillID, t.jobListingID] })])

export const jobListingApplicationsTable = pgTable("job_listing_applications", {
  id: bigint({ mode: "bigint" }).primaryKey().$default(() => snowflake.nextId()),
  jobListingID: bigint("job_listing_id", { mode: "bigint" }).notNull().references(() => jobListingsTable.id, { onDelete: 'cascade' }),
  userID: bigint("user_id", { mode: "bigint" }).notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  coverLetter: varchar("cover_letter", { length: 400 }),
  rating: integer(),
  stage: varchar({ length: 50 }).default("APPLIED"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
}, t => [uniqueIndex().on(t.jobListingID, t.userID), index().on(t.userID)])

export const userResumesTable = pgTable('user_resumes', {
  id: bigint({ mode: "bigint" }).primaryKey().$default(() => snowflake.nextId()),
  userID: bigint("user_id", { mode: "bigint" }).notNull().unique().references(() => usersTable.id, { onDelete: 'cascade' }),
  fileKey: varchar("file_key", { length: 255 }).notNull(),
  summury: text(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
})