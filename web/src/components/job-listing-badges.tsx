import {
  formatExperienceLevel,
  formatJobLocationRequirement,
  formatJobType,
  formatWageInPaise,
} from '@/utils/formatters/job-listing';
import { Badge } from './ui/badge';
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
    wageInPaise: number;
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
      <Badge variant={'outline'}>
        <BanknoteIcon />
        {formatWageInPaise(jobListing.wageInPaise, jobListing.wageInterval as WageInterval)}
      </Badge>
      <Badge variant={'outline'}>
        <BuildingIcon />
        {formatJobLocationRequirement(
          jobListing.locationRequirement as JobLocationRequirement
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
