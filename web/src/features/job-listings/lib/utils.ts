import { JobListingStatus } from "@/constants/job-listing";

export function getNextJobListingStatus(currentStatus: JobListingStatus) {
  switch (currentStatus) {
    case 'DRAFT':
    case 'UNLISTED':
      return 'PUBLISHED' as const;
    case 'PUBLISHED':
      return 'UNLISTED' as const;
    default:
      throw new Error(
        `Unkown job listing status: ${currentStatus satisfies never}`,
      );
  }
}

export function sortJobListingsByStatus(a: JobListingStatus, b: JobListingStatus) {
  return JOB_LISTING_STATUS_SORT_ORDER[a] - JOB_LISTING_STATUS_SORT_ORDER[b]
}

const JOB_LISTING_STATUS_SORT_ORDER = {
  PUBLISHED: 0,
  DRAFT: 1,
  UNLISTED: 2
} as const