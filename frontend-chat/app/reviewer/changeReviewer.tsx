import { toast } from '../../src/components/ui/use-toast';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { Button } from '../../src/components/ui/button';
import { useAppManagment } from '../../src/context/AppManagment';
import { useState } from 'react';
import { useAbiClient } from '../../src/context/AbiProvider';

export const ChangeReviewer = () => {
  const { client } = useWalletClient();
  const { feesABI } = useAbiClient();

  const { isPendingReviewer, setIsReviewer, setIsPendingReviewer } =
    useAppManagment();

  const [pendingReviewer, setPendingReviewer] = useState('');

  const handleSubmitPendingReviewer = async () => {
    try {
      const tx = await client?.useABI(feesABI).set_pending_reviewer({
        type_arguments: [],
        arguments: [pendingReviewer as `0x${string}`],
      });

      toast({
        title: 'Set Pending reviewer',
        description: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}
            target="_blank"
          >
            {tx?.hash}
          </a>
        ),
        variant: 'default',
      });

      setPendingReviewer('');
      setIsPendingReviewer(false);
      setIsReviewer(true);
    } catch (error) {
      toast({
        title: 'Error submot',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const handleAcceptReviewer = async () => {
    try {
      const tx = await client?.useABI(feesABI).accept_reviewer({
        type_arguments: [],
        arguments: [],
      });

      toast({
        title: 'Accepted Reviewer',
        description: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}
            target="_blank"
          >
            {tx?.hash}
          </a>
        ),
        variant: 'default',
      });

      setIsReviewer(true);
    } catch (error) {
      toast({
        title: 'Error accepting admin',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mt-10">
      {isPendingReviewer && (
        <div>
          <h2>Previous reviewer select you to be the reviewer now</h2>
          <button
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            onClick={handleAcceptReviewer}
          >
            Accept reviewer
          </button>
        </div>
      )}
      {!isPendingReviewer && (
        <div>
          <LabeledInput
            id="pending-admin-address"
            label="Set the new admin address"
            tooltip="Who will be the new admin"
            required={true}
            value={pendingReviewer}
            onChange={(e) =>
              setPendingReviewer(e.target.value as `0x${string}`)
            }
            type="text"
          />

          <Button
            onClick={handleSubmitPendingReviewer}
            variant="green"
            className="mt-10 mb-20"
          >
            Set pending reviewer
          </Button>
        </div>
      )}
    </div>
  );
};
