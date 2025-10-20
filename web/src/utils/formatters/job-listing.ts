import type { ExperienceLevel, JobLocationRequirement, JobListingStatus, JobType, WageInterval } from "@/constants/job-listing";

export function formatWageInterval(wageInterval: WageInterval) {
  switch (wageInterval) {
    case 'HOURLY':
      return 'Hour';
    case 'YEARLY':
      return 'Year';
    default:
      throw new Error(`Unkown wage interval: ${wageInterval satisfies never}`)
  }
}

export function formatJobLocationRequirement(jobLocationRequirement: JobLocationRequirement) {
  switch (jobLocationRequirement) {
    case 'IN_OFFICE':
      return 'In office';
    case 'HYBRID':
      return 'Hybrid';
    case 'REMOTE':
      return 'Remote'
    default:
      throw new Error(`Unkown job location requirement: ${jobLocationRequirement satisfies never}`)
  }
}

export function formatJobType(jobType: JobType) {
  switch (jobType) {
    case 'INTERNSHIP':
      return 'Internship';
    case 'FULL_TIME':
      return 'Full-time';
    case 'PART_TIME':
      return 'Part-time';
    default:
      throw new Error(`Unkown job type: ${jobType satisfies never}`)
  }
}

export function formatExperienceLevel(experienceLevel: ExperienceLevel) {
  switch (experienceLevel) {
    case 'JUNIOR':
      return 'Junior';
    case 'MID_LEVEL':
      return 'Intermediate';
    case 'SENIOR':
      return 'Senior'
    default:
      throw new Error(`Unkown experience level: ${experienceLevel satisfies never}`)
  }
}

export function formatJobStatus(jobStatus: JobListingStatus) {
  switch (jobStatus) {
    case 'DRAFT':
      return 'Draft';
    case 'UNLISTED':
      return 'Unlisted';
    case 'PUBLISHED':
      return 'Active'
    default:
      throw new Error(`Unkown status: ${jobStatus satisfies never}`)
  }
}

export function formatWageInPaise(wageInPaise: number, wageInterval: WageInterval) {
  const formatter = Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  })

  switch (wageInterval) {
    case 'HOURLY':
      return `${formatter.format(wageInPaise / 100)} / hr`
    case 'YEARLY':
      return `${formatter.format(wageInPaise / 100)}`
    default:
      throw new Error(`Unkown wage interval: ${wageInterval satisfies never}`)
  }
}