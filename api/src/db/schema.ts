import { customType, index, inet, pgTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

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

export const bigint = customType<{ data: bigint }>({
  dataType: () => "bigint",
  fromDriver: (value) => (value as any).toString(),
})

export const usersTable = pgTable("users", {
  id: bigint().primaryKey().$default(() => snowflake.nextId()),
  displayName: varchar("display_name", { length: 50 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  image: varchar({ length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date())
})

export const sessionsTable = pgTable("sessions", {
  id: bigint().primaryKey().$default(() => snowflake.nextId()),
  userId: bigint("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  secret: bytea().notNull().unique(),
  ipAddress: inet("ip_address"),
  userAgent: varchar('user_agent', { length: 255 }),
  expiresAt: timestamp("expires_at").notNull().$default(() => new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, t => ([
  index().on(t.userId),
]))

export const accountsTable = pgTable("accounts", {
  id: bigint().primaryKey().$default(() => snowflake.nextId()),
  userId: bigint("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  provider: varchar({ length: 50 }).notNull(),
  accessToken: varchar("access_token", { length: 255 }),
  refreshToken: varchar("refresh_token", { length: 255 }),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: varchar({ length: 255 }),
  password: varchar({ length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date())
}, t => ([
  uniqueIndex().on(t.provider, t.accessToken)
]))