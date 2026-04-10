import {z} from 'zod';

export const jobListingSchema = z
  .object({
    title: z.string().nonempty(),
    description: z.string().nonempty(),
    experienceLevel: z.enum(['JUNIOR', 'MID_LEVEL', 'SENIOR']),
    locationRequirement: z.enum(['IN_OFFICE', 'HYBRID', 'REMOTE']),
    streetAddress: z.string(),
    type: z.enum(['INTERNSHIP', 'PART_TIME', 'FULL_TIME']),
    wage: z.number().int().positive().min(1).nullable(),
    wageInterval: z.enum(['HOURLY', 'YEARLY']).nullable(),
    openings: z.number().int().min(1).positive(),
  })
  .refine(
    data => data.locationRequirement === 'REMOTE' || data.streetAddress != null,
    {
      error: 'Street address required for non-remote listing',
      path: ['streetAddress'],
    },
  );
