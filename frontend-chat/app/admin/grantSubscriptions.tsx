import { ConfirmButton } from '../../src/components/ui/confirm-button';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { useToast } from '../../src/components/ui/use-toast';
import { useAbiClient } from '../../src/context/AbiProvider';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { useState } from 'react';
import { truncateAddress } from '@aptos-labs/wallet-adapter-core';

export const GrantSubscriptions = () => {
  const [days, setDays] = useState(0);
  const [grantedAddress, setGrantedAddress] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { abi, subscriptionABI } = useAbiClient();
  const { client } = useWalletClient();
  const { toast } = useToast();

  const onGrantSubscription = async () => {
    try {
      setIsUpdating(true);
      const hasSubscription = await abi
        ?.useABI(subscriptionABI)
        .view.has_subscription_active({
          typeArguments: [],
          functionArguments: [grantedAddress as `0x${string}`],
        });

      if (hasSubscription?.[0]) {
        toast({
          title: 'Error granting subscription',
          description: 'The account already has a subscription.',
          variant: 'destructive',
        });

        setIsUpdating(false);
        return;
      }

      const duration = days * 24 * 60 * 60;

      const tx = await client?.useABI(subscriptionABI).gift_subscription({
        type_arguments: [],
        arguments: [grantedAddress as `0x${string}`, duration],
      });

      toast({
        title: 'Subscription gifted',
        description: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}
            target="_blank"
          >
            Transaction {tx?.hash}
          </a>
        ),
      });

      setGrantedAddress('');
      setDays(0);
    } catch (error) {
      toast({
        title: 'Error checking subscription status',
        description: `${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <div className="mb-10">
        <LabeledInput
          id="granted-duration-subscription"
          label="Duration (Days) of Subscription"
          tooltip="Duration in days"
          required={true}
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          type="number"
        />
      </div>

      <div className="mb-10">
        <LabeledInput
          id="granted-address-subscription"
          label="Account Address"
          tooltip="The address of the account to gift the subscription to"
          required={true}
          value={grantedAddress}
          onChange={(e) => setGrantedAddress(e.target.value as `0x${string}`)}
          type="text"
        />
      </div>

      <div className="pt-4">
        <ConfirmButton
          variant="green"
          title="Grant Subscription"
          onSubmit={onGrantSubscription}
          disabled={isUpdating || !grantedAddress || days <= 0}
          confirmMessage={
            <p>
              You will grant a subscription for the account{' '}
              {truncateAddress(grantedAddress)} with the given duration {days}.
              <br />
              <br />
              Do you agree with this action?
            </p>
          }
        />
      </div>
    </div>
  );
};
