import {useFadeEffect} from '@/hooks/use-fade-effect';
import {cn} from '@/lib/utils';
import {useRouterState} from '@tanstack/react-router';

export function TransLayer() {
  const isLoading = useRouterState({select: state => state.isLoading});
  const [shouldRender, shouldFadeIn, useFadeRef] = useFadeEffect(isLoading);

  if (!shouldRender) return null;

  return (
    <div
      ref={useFadeRef}
      className={cn(
        'absolute z-1000 inset-0 bg-[#eee] dark:bg-black opacity-0 transition-opacity duration-1000',
        shouldFadeIn && 'opacity-60 dark:opacity-80 transition-opacity duration-1000',
      )}
    />
  );
}
