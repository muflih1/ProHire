import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { AlertDialogTitle } from '@radix-ui/react-alert-dialog';
import { VariantProps } from 'class-variance-authority';
import React, { memo, useCallback, useMemo, useState } from 'react';

type DialogProps = {
  actionButton?: {
    title?: React.ReactNode;
  } & VariantProps<typeof buttonVariants>;
};

export default function useConfirm(title: string, message: string) {
  const [promise, setPromise] = useState<null | {
    resolve: (value: boolean) => void;
  }>(null);

  const confirm = useCallback(
    () =>
      new Promise(resolve => {
        setPromise({ resolve });
      }),
    []
  );

  const handleClose = useCallback(() => {
    setPromise(null);
  }, []);

  const handleConfirm = useCallback(() => {
    promise?.resolve(true);
    handleClose();
  }, [promise, handleClose]);

  const handleCancel = useCallback(() => {
    promise?.resolve(false);
    handleClose();
  }, [promise, handleClose]);

  const ConfirmationDialog = useMemo(
    () =>
      memo(
        ({
          actionButton = {
            title: 'Continue',
            variant: 'default',
            size: 'default',
          },
        }: DialogProps) => (
          <AlertDialog open={promise !== null ? true : undefined}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className='text-xl font-bold'>
                  {title}
                </AlertDialogTitle>
                <AlertDialogDescription>{message}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCancel}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant={actionButton.variant}
                  size={actionButton.size}
                  onClick={handleConfirm}
                >
                  {actionButton.title}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      ),
    [handleCancel, handleConfirm]
  );

  return useMemo(
    () => [ConfirmationDialog, confirm] as const,
    [ConfirmationDialog, confirm]
  );
}
