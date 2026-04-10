import { JobListingStatus } from "@/constants/job-listing";

export function getNextJobListingStatus(currentStatus: JobListingStatus) {
  switch (currentStatus) {
    case 'DRAFT':
    case 'UNLISTED':
      return 'PUBLISHED';
    case 'PUBLISHED':
      return 'UNLISTED';
    default:
      throw new Error(
        `Unkown job listing status: ${currentStatus satisfies never}`,
      );
  }
}