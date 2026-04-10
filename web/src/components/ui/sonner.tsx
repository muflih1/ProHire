import {Toaster as Sonner, type ToasterProps} from 'sonner';

const Toaster = ({...props}: ToasterProps) => {
  return (
    <Sonner
      theme={'light'}
      className='toaster group'
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            'cn-toast bg-background text-foreground text-sm border border-border shadow-lg rounded-lg p-4 flex flex-row gap-2 items-center',
          success: '[&_svg]:text-green-600',
          info: '[&_svg]:text-blue-600',
          error: '[&_svg]:text-destructive',
          warning: '[&_svg]:text-yellow-600',
        },
      }}
      {...props}
    />
  );
};

export {Toaster};
