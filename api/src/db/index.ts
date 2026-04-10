import 'dotenv/config'
import * as pg from 'pg';
import {drizzle} from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

const client = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(client, {schema, logger: false});
