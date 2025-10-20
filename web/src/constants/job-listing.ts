export const wageIntervals = ['HOURLY', 'YEARLY'] as const
export type WageInterval = typeof wageIntervals[number]

export const jobLocationRequirements = ['IN_OFFICE', 'HYBRID', 'REMOTE'] as const
export type JobLocationRequirement = typeof jobLocationRequirements[number]

export const jobTypes = ['INTERNSHIP', 'PART_TIME', 'FULL_TIME'] as const
export type JobType = typeof jobTypes[number]

export const experienceLevels = ['JUNIOR', 'MID_LEVEL', 'SENIOR'] as const
export type ExperienceLevel = typeof experienceLevels[number]

export const jobListingStatus = ['DRAFT', 'UNLISTED', 'PUBLISHED'] as const
export type JobListingStatus = typeof jobListingStatus[number]
