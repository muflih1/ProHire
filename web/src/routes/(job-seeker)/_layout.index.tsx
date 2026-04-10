import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/(job-seeker)/_layout/')({
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <div>Hi</div>
  );
}
