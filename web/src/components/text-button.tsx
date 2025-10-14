import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type React from 'react';
import { Link } from 'react-router';

export const buttonVariants = cva(
  'inline-flex items-center flex-row justify-center font-medium select-none text-sm min-w-0 min-h-0 box-border touch-manipulation no-underline focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] cursor-pointer active:opacity-60',
  {
    variants: {
      color: {
        default: 'text-black',
        secondary: 'text-gray-500',
        blue: 'text-blue-500',
      },
    },
    defaultVariants: {
      color: 'default',
    },
  }
);

type Props = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants> & {
    underlineOnHover?: boolean;
  };

export default function TextButton({
  underlineOnHover = false,
  color,
  className,
  role = 'link',
  ...props
}: Props) {
  return (
    <Link
      role={role}
      tabIndex={0}
      className={cn(
        buttonVariants({ color, className }),
        underlineOnHover && 'hover:underline'
      )}
      {...props}
    />
  );
}
