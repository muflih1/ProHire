import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/(employer)/_layout/employer/')({
  beforeLoad: async ({context}) => {
    const jobListing = await context.queryClient.fetchQuery(
      context.trpc.jobListings.mostRecent.queryOptions(),
    );

    if (jobListing == null) {
      throw Route.redirect({to: '/employer/job-listings/new'});
    }

    throw Route.redirect({
      to: '/employer/job-listings/$jobListingID',
      params: {jobListingID: jobListing.id.toString()},
    });
  },
  component: EmployerRoute,
});

function EmployerRoute() {
  return null;
}
