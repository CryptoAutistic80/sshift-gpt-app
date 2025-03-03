'use client';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useAbiClient } from '../../src/context/AbiProvider';
import { useEffect, useState } from 'react';
import { useToast } from '../../src/components/ui/use-toast';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { useAppManagment } from '../../src/context/AppManagment';
import { convertAmountFromOnChainToHumanReadable } from '@aptos-labs/ts-sdk';
import { COIN_DECIMALS } from '../../config/env';
import { Button } from '../../src/components/ui/button';
import { useChain } from '../../src/context/ChainProvider';

export const FundManage = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [balance, setBalance] = useState(0);
  const [feesToClaim, setFeesToClaim] = useState(0);
  const [symbol, setSymbol] = useState('');
  const { account } = useWallet();
  const { abi, feesABI } = useAbiClient();
  const { toast } = useToast();
  const { client } = useWalletClient();
  const { aptos } = useChain();
  const { resourceAccount, currency } = useAppManagment();

  useEffect(() => {
    void (async () => {
      try {
        const responseIsSubscribed = await abi
          ?.useABI(feesABI)
          .view.check_collector_object({
            typeArguments: [],
            functionArguments: [account?.address.toString() as `0x${string}`],
          });

        setIsSubscribed(Boolean(responseIsSubscribed?.[0]));
      } catch (error) {
        toast({
          title: 'Error checking subscription status',
          description: `${error}`,
          variant: 'destructive',
        });
      }
    })();
  }, [abi, account]);

  useEffect(() => {
    if (isSubscribed) {
      void (async () => {
        try {
          const coinsHold = await aptos.getAccountCoinsData({
            accountAddress: resourceAccount as `0x${string}`,
          });

          const coinSymbol = coinsHold.find(
            (coin) => coin.asset_type === currency
          )?.metadata?.symbol;

          setSymbol(coinSymbol || '');
        } catch (error) {
          toast({
            title: 'Error fetching coins data account',
            description: `${error}`,
            variant: 'destructive',
          });
        }

        try {
          const balanceResult = await abi
            ?.useABI(feesABI)
            .view.get_resource_balance({
              typeArguments: [],
              functionArguments: [],
            });

          const balance = balanceResult?.[0];

          if (balance) {
            setBalance(
              convertAmountFromOnChainToHumanReadable(
                parseInt(balance as string),
                COIN_DECIMALS
              )
            );
          }

          const feesBalanceResult = await abi
            ?.useABI(feesABI)
            .view.get_balance_to_claim({
              typeArguments: [],
              functionArguments: [account?.address.toString() as `0x${string}`],
            });

          const feesBalance = feesBalanceResult?.[0];

          setFeesToClaim(
            convertAmountFromOnChainToHumanReadable(
              parseInt(feesBalance as string),
              COIN_DECIMALS
            )
          );
        } catch (error) {
          toast({
            title: 'Error fetching balance',
            description: `${error}`,
            variant: 'destructive',
          });
        }
      })();
    }
  }, [abi, isSubscribed]);

  const onSubscribe = async () => {
    try {
      const tx = await client?.useABI(feesABI).create_collector_object({
        type_arguments: [],
        arguments: [],
      });

      toast({
        title: 'Subscribed',
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

      setIsSubscribed(true);
    } catch (error) {
      toast({
        title: 'Error subscribing',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const onClaim = async () => {
    try {
      const tx = await client?.useABI(feesABI).claim_salary({
        type_arguments: [],
        arguments: [],
      });

      toast({
        title: 'Claimed fees',
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

      setBalance(0);
    } catch (error) {
      toast({
        title: 'Error claiming fees',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="m-20">
      <h2>Fund Management</h2>
      {isSubscribed ? (
        <div>
          <p>
            Balance of the resource account: {balance} {symbol}
          </p>
          <p>
            Fees to claim: {feesToClaim} {symbol}
          </p>
          <Button
            variant="green"
            onClick={onClaim}
            disabled={feesToClaim === 0}
          >
            Claim
          </Button>
        </div>
      ) : (
        <div>
          <h3>You need to subscribe in order to claim winning fees</h3>
          <Button onClick={onSubscribe} variant="green">
            Subscribe
          </Button>
        </div>
      )}
    </div>
  );
};
