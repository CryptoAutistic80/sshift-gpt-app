'use Client';

import { useAbiClient } from '../../src/context/AbiProvider';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { SubscriptionABI, SubscriptionMoveABI } from '@aptos';
import { useEffect, useState } from 'react';
import { Chain, IMoveBotFields, ISubscription } from '@helpers';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { CollectionDiscoount } from './collectionsDiscount';
import { toast } from '../../src/components/ui/use-toast';
import { calculatePrice } from '../../src/lib/utils';
import { truncateAddress, useWallet } from '@aptos-labs/wallet-adapter-react';
import {
  AccountAddress,
  convertAmountFromHumanReadableToOnChain,
  convertAmountFromOnChainToHumanReadable,
} from '@aptos-labs/ts-sdk';
import { COIN_DECIMALS } from '../../config/env';
import { ConfirmButton } from '../../src/components/ui/confirm-button';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { useChain } from '../../src/context/ChainProvider';

export const Subscription = () => {
  const { abi, subscriptionABI } = useAbiClient();
  const { client } = useWalletClient();
  const { account } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const { aptos, chain } = useChain();

  const [subscription, setSubscription] = useState<ISubscription>({
    collections_discount: [],
    prices: [],
    max_days: 0,
    token_creator: '' as `0x${string}`,
    token_collection: '' as `0x${string}`,
    token_name: '',
    token_property_version: 0,
  });

  const disableSubmitCoinfigButton =
    (chain === Chain.Aptos &&
      (!subscription.token_creator ||
        !subscription.token_collection ||
        !subscription.token_name ||
        subscription.token_property_version === undefined ||
        subscription.token_property_version < 0)) ||
    subscription.max_days <= 0 ||
    !subscription.collections_discount?.[0]?.collection_addr ||
    subscription.collections_discount?.some((c) => c.discount_per_day <= 0);
  const onAddCollectionDiscount = () => {
    setSubscription({
      ...subscription,
      collections_discount: [
        ...subscription.collections_discount,
        {
          collection_addr: '' as `0x${string}`,
          discount_per_day: 1,
        },
      ],
    });
  };

  const onRemoveCollectionDiscount = (index: number) => {
    setSubscription({
      ...subscription,
      collections_discount: [
        ...subscription.collections_discount.filter((_c, i) => index !== i),
      ],
    });
  };

  const onChangeAddressCollection = (index: number, address: string) => {
    setSubscription({
      ...subscription,
      collections_discount: [
        ...subscription.collections_discount.map((c, i) => {
          const value = { ...c };
          if (i === index) {
            value.collection_addr = address as `0x${string}`;
          }

          return value;
        }),
      ],
    });
  };

  const onChangePricePerDayCollection = (
    index: number,
    discount_per_day: number
  ) => {
    setSubscription({
      ...subscription,
      collections_discount: [
        ...subscription.collections_discount.map((c, i) => {
          const value = { ...c };
          if (i == index) {
            value.discount_per_day = discount_per_day;
          }

          return value;
        }),
      ],
    });
  };

  const onChangeSubscriptionConfig = async () => {
    let response;
    try {
      setIsLoading(true);

      const prices = [];

      for (let i = 0; i < subscription.max_days; i++) {
        const price = calculatePrice(i + 1);
        prices.push(
          Math.ceil(
            convertAmountFromHumanReadableToOnChain(price, COIN_DECIMALS)
          )
        );
      }

      if (chain === Chain.Aptos) {
        response = await client?.useABI(SubscriptionABI).set_plan({
          type_arguments: [],
          arguments: [
            prices,
            subscription.collections_discount.map((c) => c.collection_addr),
            subscription.collections_discount.map((c) =>
              convertAmountFromHumanReadableToOnChain(
                c.discount_per_day,
                COIN_DECIMALS
              )
            ),
            subscription.token_creator as `0x${string}`,
            subscription.token_collection,
            subscription.token_name,
            subscription.token_property_version,
          ],
        });
      } else {
        response = await client?.useABI(SubscriptionMoveABI).set_plan({
          type_arguments: [],
          arguments: [
            prices,
            subscription.collections_discount.map((c) => c.collection_addr),
            subscription.collections_discount.map((c) =>
              convertAmountFromHumanReadableToOnChain(
                c.discount_per_day,
                COIN_DECIMALS
              )
            ),
          ],
        });
      }

      const committedTransactionResponse = await aptos.waitForTransaction({
        transactionHash: response?.hash as string,
      });

      if (committedTransactionResponse.success) {
        toast({
          variant: 'default',
          title: 'Subscription config saved',
          description: 'Subscription config was save successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error saving subscription config settings',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNfts = async () => {
    const nfts = await aptos.account.getAccountOwnedTokens({
      accountAddress: AccountAddress.fromString(
        account?.address.toString() as string
      ),
    });

    console.log(nfts);
  };

  const getCoins = async () => {
    const coins = await aptos.account.getAccountCoinsData({
      accountAddress: AccountAddress.fromString(
        account?.address.toString() as string
      ),
    });

    console.log(coins);
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        let moveBotFields;
        await getNfts();
        await getCoins();
        const subscriptionResult = await abi
          ?.useABI(subscriptionABI)
          .view.get_subscription_config({
            functionArguments: [],
            typeArguments: [],
          });

        const subscriptionCopy = subscriptionResult?.[0] as ISubscription;

        if (chain === Chain.Aptos) {
          try {
            const moveBotFieldsResult = await abi
              ?.useABI(SubscriptionABI)
              .view.get_move_bot_fields({
                functionArguments: [],
                typeArguments: [],
              });

            moveBotFields = moveBotFieldsResult?.[0] as IMoveBotFields;
          } catch (error) {
            console.error('Move bot fields are not set yet', error);
          }
        }

        if (!subscriptionCopy.collections_discount?.length) {
          subscriptionCopy.collections_discount = [
            {
              collection_addr: '' as `0x${string}`,
              discount_per_day: 0,
            },
          ];
        }

        subscriptionCopy.collections_discount = [
          ...subscriptionCopy.collections_discount.map((c) => ({
            collection_addr: c.collection_addr,
            discount_per_day: convertAmountFromOnChainToHumanReadable(
              c.discount_per_day,
              COIN_DECIMALS
            ),
          })),
        ];

        subscriptionCopy.prices = subscriptionCopy.prices.map((p) =>
          convertAmountFromOnChainToHumanReadable(p, COIN_DECIMALS)
        );

        subscriptionCopy.max_days = subscriptionCopy.prices.length || 0;

        if (moveBotFields) {
          subscriptionCopy.token_creator = moveBotFields.token_creator;
          subscriptionCopy.token_collection = moveBotFields.token_collection;
          subscriptionCopy.token_name = moveBotFields.token_name;
          subscriptionCopy.token_property_version =
            moveBotFields.token_property_version;
        }

        setSubscription(subscriptionCopy);
      } catch (error) {
        toast({
          title: 'Error fetching subscription configuration',
          description: `${error}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [abi, chain]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {subscription.prices.map((price, index) => (
          <div key={`${index}-${price}`}>
            {index + 1}: {price.toFixed(2)}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <LabeledInput
          label="Maximum days"
          onChange={(e) =>
            setSubscription({
              ...subscription,
              max_days: parseInt(e.target.value),
            })
          }
          value={subscription.max_days || subscription.prices.length || 0}
          type="number"
          id="subscription-max-days"
          required
          tooltip="Set the maximum subscription duration in days"
        />
      </div>

      <div className="space-y-4">
        {subscription.collections_discount.map((discount, index) => (
          <CollectionDiscoount
            key={`collection-discount-${index}`}
            onChangeAddress={onChangeAddressCollection}
            onChangeDiscountPerDay={onChangePricePerDayCollection}
            onAdd={onAddCollectionDiscount}
            onRemove={() => onRemoveCollectionDiscount(index)}
            address={discount.collection_addr}
            amount={discount.discount_per_day as number}
            isUpdating={isLoading}
            index={index}
          />
        ))}
      </div>

      {chain === Chain.Aptos && (
        <div className="space-y-4">
          <LabeledInput
            label="Token Creator"
            onChange={(e) =>
              setSubscription({
                ...subscription,
                token_creator: e.target.value as `0x${string}`,
              })
            }
            value={subscription.token_creator}
            type="text"
            id="subscription-token-creator"
            required
            tooltip="Set the Move Bot ID creator"
          />

          <LabeledInput
            label="Token Collection Name"
            onChange={(e) =>
              setSubscription({
                ...subscription,
                token_collection: e.target.value,
              })
            }
            value={subscription.token_collection}
            type="text"
            id="subscription-token-collection"
            required
            tooltip="Set the Move Bot ID collection name"
          />

          <LabeledInput
            label="Token Name"
            onChange={(e) =>
              setSubscription({
                ...subscription,
                token_name: e.target.value,
              })
            }
            value={subscription.token_name}
            type="text"
            id="subscription-token-name"
            required
            tooltip="Set the Move Bot ID token name"
          />

          <LabeledInput
            label="Token Property Version"
            onChange={(e) =>
              setSubscription({
                ...subscription,
                token_property_version: parseInt(e.target.value),
              })
            }
            value={subscription.token_property_version}
            type="number"
            id="subscription-token-property-version"
            required
            tooltip="Set the Move Bot ID property version"
          />
        </div>
      )}

      <div className="pt-4">
        <ConfirmButton
          variant="green"
          title="Save Config"
          onSubmit={onChangeSubscriptionConfig}
          disabled={disableSubmitCoinfigButton}
          confirmMessage={
            <p>
              These are the new settings:
              <br />
              Collections for Discount:
              <br />
              {subscription.collections_discount.map((c) => (
                <p key={`collections-discount-to-submit`}>
                  Address: {truncateAddress(c.collection_addr)}
                  <br />
                  Amount: {c.discount_per_day}
                </p>
              ))}
              {chain === Chain.Aptos && (
                <>
                  <br />
                  Token creator: {truncateAddress(subscription.token_creator)}
                  <br />
                  Token collection: {subscription.token_collection}
                  <br />
                  Token name: {subscription.token_name}
                  <br />
                  Token property version: {subscription.token_property_version}
                  <br />
                </>
              )}
              Do you agree?
            </p>
          }
        />
      </div>

      <LoadingSpinner on={isLoading} />
    </div>
  );
};
