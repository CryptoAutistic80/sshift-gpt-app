import { toast } from '../../src/components/ui/use-toast';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { Button } from '../../src/components/ui/button';
import { useAppManagment } from '../../src/context/AppManagment';
import { useEffect, useState } from 'react';
import { useAbiClient } from '../../src/context/AbiProvider';
import { ISubscriptionToClaim } from '@helpers';
import { truncateAddress } from '@aptos-labs/wallet-adapter-core';
import { useAuth } from '../../src/context/AuthProvider';

export const ClaimSubscripton = () => {
  const { client } = useWalletClient();
  const { abi, subscriptionABI } = useAbiClient();
  const { setHasSubscriptionToClaim } = useAppManagment();
  const { walletAddress } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [subscriptionToClaim, setSubscriptionToClaim] =
    useState<ISubscriptionToClaim>({
      account: '',
      duration: 0,
    });

  const onClaimSubscription = async () => {
    try {
      setIsUpdating(true);
      const tx = await client?.useABI(subscriptionABI).claim_subscription({
        type_arguments: [],
        arguments: [],
      });

      toast({
        title: 'Claimed subscription successfully',
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

      setHasSubscriptionToClaim(false);
    } catch (error) {
      toast({
        title: 'Error claiming subscription',
        description: `${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const subscriptionToClaimResult = await abi
          ?.useABI(subscriptionABI)
          .view.get_subscription_to_claim({
            typeArguments: [],
            functionArguments: [walletAddress as `0x${string}`],
          });

        if (subscriptionToClaimResult?.[0]) {
          const { account, duration } =
            subscriptionToClaimResult[0] as ISubscriptionToClaim;
          setSubscriptionToClaim({
            account,
            duration: Math.ceil(duration / (24 * 60 * 60)),
          });
        }
      } catch (error) {
        toast({
          title: 'Error fetching subscription to claim',
          description: `${error}`,
          variant: 'destructive',
        });
      }
    })();
  }, [abi, walletAddress]);

  return (
    <div className="mt-10">
      <div>
        <h2>You have Subscription to claim</h2>
        <p>
          Account: {truncateAddress(subscriptionToClaim.account)}
          <br />
          Duration: {subscriptionToClaim.duration}{' '}
          {subscriptionToClaim.duration > 1 ? 'days' : 'day'}
        </p>

        <Button
          variant="green"
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md mt-10"
          onClick={onClaimSubscription}
          disabled={isUpdating}
        >
          Claim subscription
        </Button>
      </div>
    </div>
  );
};
