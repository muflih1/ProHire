import {db} from '../../db/index.js';
import {jobListingsTable, userResumesTable} from '../../db/schema.js';
import {and, eq} from 'drizzle-orm';
import {r2} from '../../lib/r2.js';
import {GetObjectCommand} from '@aws-sdk/client-s3';
import {env} from '../../env.js';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {organizationsRouter} from './organizations.router.js';
import {sessionsRouter} from './sessions.router.js';
import {jobListingsRouter} from './job-listings.router.js';
import {createTRPCRouter} from '../init.js';
import {billingsRouter} from './billings.router.js';

export const appRouter = createTRPCRouter({
  organizations: organizationsRouter,
  sessions: sessionsRouter,
  jobListings: jobListingsRouter,
  billings: billingsRouter,
});

async function getUserResumeFileKey(userID: bigint) {
  const [resume] = await db
    .select({fileKey: userResumesTable.fileStorageKey})
    .from(userResumesTable)
    .where(eq(userResumesTable.userID, userID));
  return resume?.fileKey;
}

async function getPublicJobListing(id: bigint) {
  const [jobListing] = await db
    .select()
    .from(jobListingsTable)
    .where(
      and(
        eq(jobListingsTable.id, id),
        eq(jobListingsTable.status, 'PUBLISHED'),
      ),
    );
  if (jobListing == null) return null;
  return jobListing;
}

async function getUserResume(userID: bigint) {
  const [userResume] = await db
    .select()
    .from(userResumesTable)
    .where(eq(userResumesTable.userID, userID))
    .limit(1);
  if (userResume == null) return null;
  const uri = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: userResume.fileStorageKey,
    }),
    {expiresIn: 3600},
  );
  return {
    id: userResume.id,
    summury: userResume.summury,
    file: {uri},
  };
}
