import {cn} from '@/lib/utils';
import {useRouterState} from '@tanstack/react-router';

export function PageProgressAnimation() {
  const isLoading = useRouterState({select: state => state.isLoading});

  return (
    <div className={cn('fixed h-0.75 inset-0 z-1001', !isLoading && 'hidden')}>
      <div
        className={cn(
          'h-full w-1/4 bg-[#68e] absolute top-0 left-0 origin-top-left transform-[scaleX(0)]',
          isLoading && 'animate-page-progress-animation',
        )}
      />
    </div>
  );
}
