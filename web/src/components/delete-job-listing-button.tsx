import useConfirm from "@/hooks/use-confirm";
import { Button } from "./ui/button";
import { Trash2Icon } from "lucide-react";
import { useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE } from "@/providers/active-organization-provider";
import { useNavigate } from "react-router";
import { useTRPC } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";

export default function DeleteJobListingButton({ jobListingID, size = 'default' }: { jobListingID: bigint; size?: 'default' | 'sm' }) {
  const organization = useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { mutate, isPending } = useMutation(
    trpc.deleteJobListing.mutationOptions({
      onSuccess: () => {
        navigate('/employers', { replace: true });
      },
    })
  );
  const [Dialog, confirm] = useConfirm(
    'Are you sure?',
    'This action cannot be undone. This will permanently delete your job listing and remove the data from our servers.'
  );

  return (
    <>
      <Button
        disabled={isPending}
        variant={'destructive'}
        onClick={async () => {
          if (!(await confirm())) return;
          mutate({
            jobListingID: jobListingID.toString(),
            organizationID: organization.id.toString(),
          });
        }}
        size={size}
      >
        <Trash2Icon />
        Delete
      </Button>
      <Dialog actionButton={{ title: 'Delete', variant: 'destructive' }} />
    </>
  );
}