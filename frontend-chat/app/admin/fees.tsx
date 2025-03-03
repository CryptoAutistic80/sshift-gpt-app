'use client';
import { useAbiClient } from '../../src/context/AbiProvider';
import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import {
  convertAmountFromHumanReadableToOnChain,
  convertAmountFromOnChainToHumanReadable,
} from '@aptos-labs/ts-sdk';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { toast } from '../../src/components/ui/use-toast';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { Button } from '../../src/components/ui/button';
import { RESOURCE_ACCOUNT_SEED } from '../../config/env';
import { useAppManagment } from '../../src/context/AppManagment';

export const Fees = () => {
  const { abi, feesABI } = useAbiClient();
  const [isCurrencySet, setIsCurrencySet] = useState(false);
  const [newAddress, setNewAddress] = useState<`0x${string}`>();
  const [isResourceAccountSet, setIsResourceAccountSet] =
    useState<boolean>(false);
  const [collectorsSubscribed, setCollectorsSubscribed] = useState<
    `0x${string}`[]
  >([]);
  const [collectorsNotSubscribed, setCollectorsNotSubscribed] = useState<
    `0x${string}`[]
  >([]);
  const [initialCollectors, setInitialCollectors] = useState<`0x${string}`[]>(
    []
  );
  const [fees, setFees] = useState<number[]>([]);
  const [resourceAccountBalance, setResourceAccountBalance] =
    useState<number>(0);
  const { connected } = useWallet();
  const { client } = useWalletClient();
  const { resourceAccount, setResourceAccount, currency, setCurrency } =
    useAppManagment();

  const disabledCreateResourceAccount =
    !initialCollectors.length || !isCurrencySet;

  useEffect(() => {
    if (isResourceAccountSet) {
      void (async () => {
        const balance = await abi?.useABI(feesABI).view.get_resource_balance({
          typeArguments: [],
          functionArguments: [],
        });

        setResourceAccountBalance(
          convertAmountFromOnChainToHumanReadable(Number(balance?.[0]), 8)
        );
      })();
    }
    void (async () => {
      let currencyCopy;
      const resourceAccountExists = await abi
        ?.useABI(feesABI)
        .view.resource_account_exists({
          typeArguments: [],
          functionArguments: [],
        });

      const isResourceAccountExists = Boolean(resourceAccountExists?.[0]);

      if (isResourceAccountExists) {
        const currencyResult = await abi
          ?.useABI(feesABI)
          .view.get_currency_addr({
            typeArguments: [],
            functionArguments: [],
          });

        currencyCopy = currencyResult?.[0];
      }

      setIsResourceAccountSet(isResourceAccountExists);
      setCurrency(currencyCopy || null);
      setIsCurrencySet(Boolean(currency));
    })();
  }, [isResourceAccountSet, abi]);

  useEffect(() => {
    void (async () => {
      const addresses = await abi?.useABI(feesABI).view.get_collectors({
        typeArguments: [],
        functionArguments: [],
      });

      const subscribers = await Promise.all(
        addresses?.[0].map(async (a) => {
          const isSubscriber = await abi
            ?.useABI(feesABI)
            .view.check_collector_object({
              typeArguments: [],
              functionArguments: [a],
            });

          return Boolean(isSubscriber?.[0]);
        }) || []
      );

      setCollectorsSubscribed([
        ...(addresses?.[0]?.filter(
          (_a, i) => subscribers[i]
        ) as `0x${string}`[]),
      ]);

      setCollectorsNotSubscribed([
        ...(addresses?.[0]?.filter(
          (_a, i) => !subscribers[i]
        ) as `0x${string}`[]),
      ]);
    })();
  }, [abi, isResourceAccountSet]);

  const onAddInitialCollector = async () => {
    setCollectorsNotSubscribed([
      ...collectorsNotSubscribed,
      newAddress as `0x${string}`,
    ]);
    setInitialCollectors([...initialCollectors, newAddress as `0x${string}`]);
    setNewAddress('' as `0x${string}`);
  };

  const onAddFees = (salary: number, employee: number) => {
    const feesCopy = [...fees];

    feesCopy[employee] = salary;

    setFees([...feesCopy]);
  };

  const onCreateResourceAccount = async () => {
    if (!connected) {
      return;
    }

    try {
      const tx = await client?.useABI(feesABI).create_resource_account({
        type_arguments: [],
        arguments: [RESOURCE_ACCOUNT_SEED as string, [...initialCollectors]],
      });

      toast({
        title: 'Created resource account',
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

      const resourceAccountAddressResult = await abi
        ?.useABI(feesABI)
        .view.get_resource_account_address({
          typeArguments: [],
          functionArguments: [],
        });

      setResourceAccount(resourceAccountAddressResult?.[0] as `0x${string}`);

      setIsResourceAccountSet(true);
    } catch (error) {
      toast({
        title: 'Error creating resource account',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const onPayCollectors = async () => {
    try {
      const tx = await client?.useABI(feesABI).payment({
        type_arguments: [],
        arguments: [
          [...collectorsSubscribed],
          [...fees.map((s) => convertAmountFromHumanReadableToOnChain(s, 8))],
        ],
      });

      toast({
        title: 'Paid collectors',
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

      setFees([...collectorsSubscribed.map(() => 0)]);
    } catch (error) {
      toast({
        title: 'Error paying collectors',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const onUptateCurrency = async () => {
    try {
      const tx = await client?.useABI(feesABI).set_currency({
        type_arguments: [],
        arguments: [currency as `0x${string}`],
      });

      toast({
        title: 'Set Currency',
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

      setIsCurrencySet(true);
    } catch (error) {
      toast({
        title: 'Error setting the currency',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {isResourceAccountSet ? (
        <>
          {/* Account Info */}
          <div className="space-y-4">
            <LabeledInput
              id="resource-account-address-input"
              label="Account Address"
              value={resourceAccount as `0x${string}`}
              type="text"
              readOnly
            />
            <LabeledInput
              id={'resource-account-balance-input'}
              label="Balance"
              value={resourceAccountBalance.toString()}
              type="text"
              readOnly
            />
            <LabeledInput
              id={'resource-account-currency-input'}
              label="Currency"
              value={currency || ''}
              type="text"
              readOnly
            />
          </div>

          {/* Collectors Section */}
          <div className="space-y-4">
            {Boolean(collectorsNotSubscribed.length) && (
              <div className="space-y-2">
                <h3 className="font-semibold">
                  Collectors not subscribed yet:
                </h3>
                {collectorsNotSubscribed.map((e, i) => (
                  <LabeledInput
                    id={`collector-${i}-address`}
                    key={`${i}-${e}`}
                    label={`Collector ${i + 1}`}
                    value={e}
                    type="text"
                    readOnly
                  />
                ))}
              </div>
            )}

            {Boolean(collectorsSubscribed.length) && (
              <div className="space-y-4">
                <h3 className="font-semibold">Subscribed collectors:</h3>
                {collectorsSubscribed.map((e, i) => (
                  <div key={`${i}-${e}`} className="space-y-2">
                    <LabeledInput
                      id={`collector-${i}-address`}
                      label={`Collector ${i + 1}`}
                      value={e}
                      type="text"
                      readOnly
                    />
                    <LabeledInput
                      id={`collector-fees-${i}`}
                      label="Fees"
                      tooltip="The fees to pay to the collector"
                      required={true}
                      value={fees[i]}
                      onChange={(e) => onAddFees(Number(e.target.value), i)}
                      type="number"
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full"
              variant="green"
              onClick={onPayCollectors}
              disabled={!collectorsSubscribed.length}
            >
              Pay collectors
            </Button>
          </div>

          {/* Currency Update Section */}
          <div className="space-y-4 pt-4 border-t">
            <LabeledInput
              id="update-currency-address"
              label="Currency Address"
              tooltip="The address currency used for all payments"
              required={false}
              value={currency || ''}
              onChange={(e) => setCurrency(e.target.value as `0x${string}`)}
              type="text"
            />
            <Button
              className="w-full"
              variant="green"
              onClick={onUptateCurrency}
              disabled={!currency}
            >
              Update Currency
            </Button>
          </div>
        </>
      ) : (
        // Resource Account Creation Section
        <div className="space-y-6">
          <div className="space-y-4">
            <LabeledInput
              id="fees-address"
              label="Address initial collector"
              tooltip="The wallet address of the initial collector"
              required={true}
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value as `0x${string}`)}
              type="text"
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={onAddInitialCollector}
              disabled={!newAddress}
            >
              Add Initial collector
            </Button>
          </div>

          {initialCollectors.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Initial Collectors</h3>
              {initialCollectors.map((e, i) => (
                <LabeledInput
                  id={`initial-collector-${i}-address`}
                  key={`${i}-${e}`}
                  label={`Collector ${i + 1}`}
                  value={e}
                  type="text"
                  readOnly
                />
              ))}
            </div>
          )}

          <div className="space-y-4 pt-4">
            <LabeledInput
              id="currency-address"
              label="Currency Address"
              tooltip="The address currency used for all payments"
              required={true}
              value={currency || ''}
              onChange={(e) => setCurrency(e.target.value as `0x${string}`)}
              type="text"
            />
            <Button
              className="w-full"
              onClick={onUptateCurrency}
              variant="green"
              disabled={!currency}
            >
              Set Currency
            </Button>
          </div>

          <Button
            className="w-full"
            variant="green"
            disabled={disabledCreateResourceAccount}
            onClick={onCreateResourceAccount}
          >
            Create resource account and set currency
          </Button>
        </div>
      )}
    </div>
  );
};
