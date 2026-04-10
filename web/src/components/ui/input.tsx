import * as React from 'react';
import {Input as InputPrimitive} from '@base-ui/react/input';

import {cn} from '@/lib/utils';

function Input({className, type, ...props}: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot='input'
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-[color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,box-shadow] ease-in-out duration-150 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:ring-3 aria-invalid:focus-visible:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:focus-visible:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

export {Input};
