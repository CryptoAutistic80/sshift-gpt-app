import { toast } from '../../src/components/ui/use-toast';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { Button } from '../../src/components/ui/button';
import { useAppManagment } from '../../src/context/AppManagment';
import { useState } from 'react';
import { useAbiClient } from '../../src/context/AbiProvider';

export const ChangeAdmin = () => {
  const { client } = useWalletClient();

  const { isPendingAdmin, setIsAdmin, setIsPendingAdmin } = useAppManagment();
  const { feesABI } = useAbiClient();

  const [pendingAdmin, setPendingAdmin] = useState('');

  const handleSubmitPendingAdmin = async () => {
    try {
      const tx = await client?.useABI(feesABI).set_pending_admin({
        type_arguments: [],
        arguments: [pendingAdmin as `0x${string}`],
      });

      toast({
        title: 'Set Pending Admin',
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

      setPendingAdmin('');
      setIsPendingAdmin(false);
      setIsAdmin(true);
    } catch (error) {
      toast({
        title: 'Error submitting',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const handleAcceptAdmin = async () => {
    try {
      const tx = await client?.useABI(feesABI).accept_admin({
        type_arguments: [],
        arguments: [],
      });

      toast({
        title: 'Accept Admin',
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

      setIsAdmin(true);
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
      {isPendingAdmin && (
        <div>
          <h2>Previous admin select you to be the admin now</h2>
          <button
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            onClick={handleAcceptAdmin}
          >
            Accept admin
          </button>
        </div>
      )}
      {!isPendingAdmin && (
        <div>
          <LabeledInput
            id="pending-admin-address"
            label="Set the new admin address"
            tooltip="Who will be the new admin"
            required={true}
            value={pendingAdmin}
            onChange={(e) => setPendingAdmin(e.target.value as `0x${string}`)}
            type="text"
          />

          <Button
            onClick={handleSubmitPendingAdmin}
            variant="green"
            className="mt-10 mb-20"
          >
            Set pending admin
          </Button>
        </div>
      )}
    </div>
  );
};
