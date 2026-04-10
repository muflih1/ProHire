import {
  formatExperienceLevel,
  formatJobLocationRequirement,
  formatJobType,
  formatWage,
} from '@/features/job-listings/lib/formatters';
import {Badge} from './ui/badge';
import {
  BanknoteIcon,
  BuildingIcon,
  GraduationCapIcon,
  HourglassIcon,
} from 'lucide-react';
import type {
  ExperienceLevel,
  JobLocationRequirement,
  JobType,
  WageInterval,
} from '@/constants/job-listing';

export default function JobListingBadges({
  jobListing,
}: {
  jobListing: {
    id: bigint;
    organizationID: bigint;
    title: string;
    description: string;
    wageInPaise: number | null;
    wageInterval: string | null;
    streetAddress: string | null;
    locationRequirement: string;
    experienceLevel: string | null;
    openings: number;
    status: string | null;
    type: string | null;
    postedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
}) {
  return (
    <>
      {jobListing.wageInPaise && (
        <Badge variant={'outline'}>
          <BanknoteIcon />
          {formatWage(
            jobListing.wageInPaise,
            jobListing.wageInterval as WageInterval,
          )}
        </Badge>
      )}
      <Badge variant={'outline'}>
        <BuildingIcon />
        {formatJobLocationRequirement(
          jobListing.locationRequirement as JobLocationRequirement,
        )}
      </Badge>
      <Badge variant={'outline'}>
        <HourglassIcon />
        {formatJobType(jobListing.type as JobType)}
      </Badge>
      <Badge variant={'outline'}>
        <GraduationCapIcon />
        {formatExperienceLevel(jobListing.experienceLevel as ExperienceLevel)}
      </Badge>
    </>
  );
}
