import {db} from '../db/index.js';
import {featuresTable, planFeaturesTable, plansTable} from '../db/schema.js';

const PLANS = [
  {
    name: 'Free',
    key: 'free_org',
    description: null,
    amountInPaise: 0,
    annualMonthlyAmountInPaise: 0,
    publiclyVisible: false,
    currency: 'INR',
    isRecurring: true,
    freeTrialEnabled: false,
    freeTrialDays: null,
    isDefault: true,
    features: [
      {
        name: 'Job Listing',
        key: 'job_listings',
        publiclyVisible: false,
      },
      {
        name: 'Job Listing Applications',
        key: 'job_listing_applications',
        publiclyVisible: false,
      },
    ],
  },
  {
    name: 'Basic',
    key: 'baisc',
    description: null,
    amountInPaise: 100000,
    annualMonthlyAmountInPaise: 80000,
    publiclyVisible: true,
    currency: 'INR',
    isRecurring: true,
    freeTrialEnabled: false,
    freeTrialDays: null,
    isDefault: false,
    features: [
      {
        name: 'Job Listing',
        key: 'job_listings',
        publiclyVisible: false,
      },
      {
        name: 'Job Listing Applications',
        key: 'job_listing_applications',
        publiclyVisible: false,
      },
      {
        name: 'Create Job Listings',
        key: 'create_job_listings',
        publiclyVisible: true,
      },
      {
        name: 'Manage Applicant Workflow',
        key: 'manage_applicant_workflow',
        publiclyVisible: true,
      },
      {
        name: 'Post 1 Job Listing',
        key: 'post_1_job_listing',
        publiclyVisible: true,
      },
    ],
  },
  {
    name: 'Growth',
    key: 'growth',
    description: null,
    amountInPaise: 500000,
    annualMonthlyAmountInPaise: 450000,
    publiclyVisible: true,
    currency: 'INR',
    isRecurring: true,
    freeTrialEnabled: false,
    freeTrialDays: null,
    isDefault: false,
    features: [
      {
        name: 'Job Listing',
        key: 'job_listings',
        publiclyVisible: false,
      },
      {
        name: 'Job Listing Applications',
        key: 'job_listing_applications',
        publiclyVisible: false,
      },
      {
        name: 'Create Job Listings',
        key: 'create_job_listings',
        publiclyVisible: true,
      },
      {
        name: 'Manage Applicant Workflow',
        key: 'manage_applicant_workflow',
        publiclyVisible: true,
      },
      {
        name: 'Post 3 Job Listings',
        key: 'post_3_job_listings',
        publiclyVisible: true,
      },
      {
        name: '1 Featured Job Listing',
        key: '1_featured_job_listing',
        publiclyVisible: true,
      },
    ],
  },
  {
    name: 'Enterprise',
    key: 'enterprise',
    description: null,
    amountInPaise: 1000000,
    annualMonthlyAmountInPaise: 800000,
    publiclyVisible: true,
    currency: 'INR',
    isRecurring: true,
    freeTrialEnabled: false,
    freeTrialDays: null,
    isDefault: false,
    features: [
      {
        name: 'Job Listing',
        key: 'job_listings',
        publiclyVisible: false,
      },
      {
        name: 'Job Listing Applications',
        key: 'job_listing_applications',
        publiclyVisible: false,
      },
      {
        name: 'Create Job Listings',
        key: 'create_job_listings',
        publiclyVisible: true,
      },
      {
        name: 'Manage Applicant Workflow',
        key: 'manage_applicant_workflow',
        publiclyVisible: true,
      },
      {
        name: 'Post Unlimed Job Listings',
        key: 'post_unlimited_job_listings',
        publiclyVisible: true,
      },
      {
        name: 'Unlimed Featured Job Listings',
        key: 'unlimited_featured_job_listings',
        publiclyVisible: true,
      },
    ],
  },
];

const allFeatures = PLANS.flatMap(plan => plan.features);

const uniqueFeatures = Array.from(
  new Map(allFeatures.map(f => [f.key, f])).values(),
);

async function seedPlans() {
  console.log('SEEDING PLANS...');
  console.log(PLANS.map(({features, ...plan}) => console.log({plan})));
  await db.transaction(async tx => {
    await tx.insert(featuresTable).values(uniqueFeatures).onConflictDoNothing();
    await tx
      .insert(plansTable)
      .values(PLANS.map(({features, ...plan}) => plan))
      // .onConflictDoNothing();

    const featureRows = await tx.select().from(featuresTable);
    const featureMap = new Map(featureRows.map(f => [f.key, f]));

    const planRows = await tx.select().from(plansTable);
    const planMap = new Map(planRows.map(p => [p.key, p]));

    const planFeatures = PLANS.flatMap(plan => {
      const planRow = planMap.get(plan.key)!;

      return plan.features.map(feature => ({
        planID: planRow.id,
        featureID: featureMap.get(feature.key)!.id,
      }));
    });

    await tx.insert(planFeaturesTable).values(planFeatures);
  });

  console.log('PLAN SEEDED SUCCESSFULLY.');
}

seedPlans()
  .then(() => {
    process.exit(0);
  })
  .catch(e => {
    console.log('SEEDING PLAN OCCURED ERROR:', e);
    process.exit(1);
  });
