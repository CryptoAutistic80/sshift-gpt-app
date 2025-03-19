'use client';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
  FC,
  PropsWithChildren,
} from 'react';
import { useAbiClient } from './AbiProvider';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useToast } from '../../src/components/ui/use-toast';
import { Chain, ICurrency, IMoveBotFields, ISubscription } from '@helpers';
import {
  QRIBBLE_NFT_ADDRESS,
  QRIBBLE_NFT_MOVE_ADDRESS,
  SSHIFT_RECORD_ADDRESS,
} from '../../config/env';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { useAuth } from './AuthProvider';
import { useChain } from './ChainProvider';
import { AccountAddress } from '@aptos-labs/ts-sdk';

export interface AppManagmentContextType {
  isAdmin: boolean;
  setIsAdmin: Dispatch<SetStateAction<boolean>>;
  isPendingAdmin: boolean;
  setIsPendingAdmin: Dispatch<SetStateAction<boolean>>;
  isCollector: boolean;
  setIsCollector: Dispatch<SetStateAction<boolean>>;
  resourceAccount: `0x${string}` | null;
  setResourceAccount: Dispatch<SetStateAction<`0x${string}` | null>>;
  currencies: ICurrency[];
  setCurrencies: Dispatch<SetStateAction<ICurrency[]>>;
  moveBotsOwned: number;
  qribbleNFTsOwned: number;
  sshiftRecordsOwned: number;
  nftAddressesRequiredOwned: string[];
  onSubscribe: (days: number, currency: string) => Promise<void>;
  startFreeTrial: () => Promise<void>;
  isSubscriptionActive: boolean;
  setIsSubscriptionActive: Dispatch<SetStateAction<boolean>>;
  expirationDate: string | null;
  isReviewer: boolean;
  setIsReviewer: Dispatch<SetStateAction<boolean>>;
  isPendingReviewer: boolean;
  setIsPendingReviewer: Dispatch<SetStateAction<boolean>>;
  hasSubscriptionToClaim: boolean;
  setHasSubscriptionToClaim: Dispatch<SetStateAction<boolean>>;
  isAppRunning: boolean;
  setAppRunning: (isRunning: boolean) => void;
}

export const AppManagmentContext = createContext<AppManagmentContextType>({
  isAdmin: false,
  setIsAdmin: () => {},
  isPendingAdmin: false,
  setIsPendingAdmin: () => {},
  isCollector: false,
  setIsCollector: () => {},
  resourceAccount: null,
  setResourceAccount: () => {},
  currencies: [],
  setCurrencies: () => {},
  moveBotsOwned: 0,
  qribbleNFTsOwned: 0,
  sshiftRecordsOwned: 0,
  nftAddressesRequiredOwned: [],
  onSubscribe: async () => {},
  startFreeTrial: async () => {},
  isSubscriptionActive: false,
  setIsSubscriptionActive: () => {},
  expirationDate: null,
  isReviewer: false,
  setIsReviewer: () => {},
  isPendingReviewer: false,
  setIsPendingReviewer: () => {},
  hasSubscriptionToClaim: false,
  setHasSubscriptionToClaim: () => {},
  isAppRunning: true,
  setAppRunning: () => {},
});

export const AppManagmentProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPendingAdmin, setIsPendingAdmin] = useState(false);
  const [isCollector, setIsCollector] = useState(false);
  const [isReviewer, setIsReviewer] = useState(false);
  const [isPendingReviewer, setIsPendingReviewer] = useState(false);
  const [resourceAccount, setResourceAccount] = useState<`0x${string}` | null>(
    null
  );
  const [moveBotsOwned, setMoveBotsOwned] = useState(0);
  const [qribbleNFTsOwned, setQribbleNFTsOwned] = useState(0);
  const [sshiftRecordsOwned, setSShiftRecordsOwned] = useState(0);
  const [nftAddressesRequiredOwned, setNftAddressesRequiredOwned] = useState<
    string[]
  >([]);

  const [hasSubscriptionToClaim, setHasSubscriptionToClaim] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [currencies, setCurrencies] = useState<ICurrency[]>([]);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [isAppRunning, setIsAppRunning] = useState<boolean>(true);

  const { abi, feesABI, subscriptionABI } = useAbiClient();
  const { connected, account } = useWallet();
  const { toast } = useToast();
  const { client } = useWalletClient();
  const { walletAddress } = useAuth();
  const { aptos, chain } = useChain();

  useEffect(() => {
    if (!connected) return;

    void (async () => {
      const hasSubscriptionToClaimResult = await abi
        ?.useABI(subscriptionABI)
        .view.has_subscription_to_claim({
          typeArguments: [],
          functionArguments: [walletAddress as `0x${string}`],
        });

      setHasSubscriptionToClaim(Boolean(hasSubscriptionToClaimResult?.[0]));
    })();
  }, [abi, connected, walletAddress]);

  useEffect(() => {
    if (!abi) return;

    void (async () => {
      const isStopped = await abi.useABI(subscriptionABI).view.get_app_status({
        typeArguments: [],
        functionArguments: [],
      });

      setAppRunning(!isStopped?.[0]);
    })();
  }, [abi]);

  useEffect(() => {
    if (!connected || !walletAddress) return;
    (async () => {
      let adminResult;
      let pendingAdminResult;
      try {
        adminResult = await abi?.useABI(feesABI).view.get_admin({
          typeArguments: [],
          functionArguments: [],
        });
      } catch (error) {
        toast({
          title: 'Error fetching admin',
          description: `Admin probably not set yet: ${error}`,
          variant: 'destructive',
        });
      }
      try {
        pendingAdminResult = await abi?.useABI(feesABI).view.get_pending_admin({
          typeArguments: [],
          functionArguments: [],
        });
      } catch (error) {
        console.error('Error fetching pending admin:', error);
      }

      const admin = AccountAddress.from(
        adminResult?.[0] as `0x${string}`
      )?.toString();

      const pendingAdmin = AccountAddress.from(
        pendingAdminResult?.[0] as `0x${string}`
      )?.toString();

      setIsAdmin(admin === walletAddress);
      setIsPendingAdmin(pendingAdmin === walletAddress);
    })();
  }, [abi, connected, walletAddress, isAdmin, isPendingAdmin]);

  useEffect(() => {
    if (!connected) return;
    (async () => {
      let collectorResult;
      try {
        collectorResult = await abi?.useABI(feesABI).view.get_collectors({
          typeArguments: [],
          functionArguments: [],
        });
      } catch (error) {
        toast({
          title: 'Error fetching collector',
          description: `Not Collectors probably set yet: ${error}`,
          variant: 'destructive',
        });
      }

      const collectors = collectorResult?.[0];

      setIsCollector(collectors?.some((c) => c === walletAddress) || false);
    })();
  }, [abi, connected, walletAddress, isCollector]);

  useEffect(() => {
    if (!connected) return;
    (async () => {
      let reviewerResult;
      let pendingReviewerResult;
      try {
        console.log(account?.publicKey.toString());

        reviewerResult = await abi?.useABI(feesABI).view.get_reviewer({
          typeArguments: [],
          functionArguments: [],
        });
      } catch (error) {
        toast({
          title: 'Error fetching collector',
          description: `Not Collectors probably set yet: ${error}`,
          variant: 'destructive',
        });
      }

      try {
        pendingReviewerResult = await abi
          ?.useABI(feesABI)
          .view.get_pending_reviewer({
            typeArguments: [],
            functionArguments: [],
          });
      } catch (error) {
        console.error('Error fetching pending reviewer:', error);
      }

      const reviewer = AccountAddress.from(
        reviewerResult?.[0] as `0x${string}`
      )?.toString();

      setIsReviewer(reviewer === walletAddress);

      const pendingReviewer = AccountAddress.from(
        pendingReviewerResult?.[0] as `0x${string}`
      )?.toString();

      setIsPendingReviewer(pendingReviewer === walletAddress);
    })();
  }, [abi, connected, walletAddress, isReviewer, isPendingReviewer]);

  useEffect(() => {
    void (async () => {
      try {
        const resourceAccountResult = await abi
          ?.useABI(feesABI)
          .view.get_resource_account_address({
            typeArguments: [],
            functionArguments: [],
          });

        const resourceAccountAddress = resourceAccountResult?.[0];

        setResourceAccount(resourceAccountAddress || null);
      } catch (error) {
        toast({
          title: 'Error fetching resource account',
          description: `Not resource account probably set yet: ${error}`,
          variant: 'destructive',
        });
      }

      try {
        const currenciesResult = await abi
          ?.useABI(feesABI)
          .view.get_currencies_addr({
            typeArguments: [],
            functionArguments: [],
          });

        const currencies = currenciesResult?.[0];

        if (currencies?.length) {
          const currenciesData = await aptos.getFungibleAssetMetadata({
            options: {
              where: {
                asset_type: {
                  _in: currencies,
                },
              },
            },
          });

          setCurrencies(
            currenciesData?.map((c) => ({
              name: c.name,
              address: c.asset_type as `0x${string}`,
              symbol: c.symbol,
              logo: c.icon_uri,
              isStableCoin: true,
              decimals: c.decimals,
            })) || []
          );
        }
      } catch (error) {
        toast({
          title: 'Error fetching token address',
          description: `Not token address probably set yet: ${error}`,
          variant: 'destructive',
        });
      }
    })();
  }, [abi]);

  useEffect(() => {
    if (!walletAddress || !aptos) return;

    void (async () => {
      try {
        let nftAddresses: string[] = [];
        const nftsHolding = await aptos.getAccountOwnedTokens({
          accountAddress: walletAddress as string,
        });

        const configResult = await abi
          ?.useABI(subscriptionABI)
          .view.get_subscription_config({
            typeArguments: [],
            functionArguments: [],
          });

        const config = configResult?.[0] as ISubscription;

        if (chain === Chain.Aptos) {
          const moveBotFieldsResult = await abi
            ?.useABI(subscriptionABI)
            .view.get_move_bot_fields({
              typeArguments: [],
              functionArguments: [],
            });

          const moveBotFields = moveBotFieldsResult?.[0] as IMoveBotFields;

          const movebotsHolding = nftsHolding.filter(
            (nft) =>
              nft.current_token_data?.token_name === moveBotFields.token_name &&
              nft.current_token_data.current_collection?.creator_address ===
                moveBotFields.token_creator &&
              nft.property_version_v1?.toString() ===
                moveBotFields.token_property_version &&
              nft.current_token_data?.current_collection?.collection_name ===
                moveBotFields.token_collection
          );

          setMoveBotsOwned(movebotsHolding.length || 0);

          const sshiftRecordsNFTCollection = config.collections_discount.find(
            (c) => c.collection_addr === SSHIFT_RECORD_ADDRESS
          );

          const sshiftRecordsHolding = nftsHolding.filter(
            (nft) =>
              nft.current_token_data?.collection_id ===
              sshiftRecordsNFTCollection?.collection_addr
          );

          setSShiftRecordsOwned(sshiftRecordsHolding.length || 0);
          nftAddresses = [
            ...nftAddresses,
            ...movebotsHolding.map((nft) => nft.token_data_id),
          ];
        }

        const qribbleNFTCollectionAddress =
          chain === Chain.Aptos
            ? QRIBBLE_NFT_ADDRESS
            : QRIBBLE_NFT_MOVE_ADDRESS;

        const qribbleNFTCollection = config.collections_discount.find(
          (c) => c.collection_addr === qribbleNFTCollectionAddress
        );

        const qribbleNFTsHolding = nftsHolding.filter(
          (nft) =>
            nft.current_token_data?.collection_id ===
            qribbleNFTCollection?.collection_addr
        );

        setQribbleNFTsOwned(qribbleNFTsHolding.length || 0);

        nftAddresses = [
          ...nftAddresses,
          ...qribbleNFTsHolding.map((nft) => nft.token_data_id),
        ];

        setNftAddressesRequiredOwned([...nftAddresses]);

        const hasSubscriptionActiveResult = await abi
          ?.useABI(subscriptionABI)
          .view.has_subscription_active({
            typeArguments: [],
            functionArguments: [walletAddress as `0x${string}`],
          });

        const hasSubscriptionActive =
          hasSubscriptionActiveResult?.[0] as boolean;

        setIsSubscriptionActive(hasSubscriptionActive);

        if (hasSubscriptionActive) {
          const subscribtionResult = await abi
            ?.useABI(subscriptionABI)
            .view.get_plan({
              typeArguments: [],
              functionArguments: [walletAddress as `0x${string}`],
            });

          const subscription = subscribtionResult?.[1];

          if (subscription?.[1]) {
            const expireDate = parseInt(subscription) * 1000;
            setExpirationDate(
              new Date(expireDate).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            );
          }
        }
      } catch (error) {
        toast({
          title: 'Error checking nft required',
          description: `Error checking nft required holding by the account: ${error}`,
          variant: 'destructive',
        });
      }
    })();
  }, [connected, walletAddress, abi, hasSubscriptionToClaim, aptos]);

  const onSubscribe = async (days: number, currency: string) => {
    try {
      const duration = days * 24 * 60 * 60;

      const tx = await client?.useABI(subscriptionABI).buy_plan({
        type_arguments: [],
        arguments: [
          duration,
          nftAddressesRequiredOwned as `0x${string}`[],
          [],
          currency as `0x${string}`,
        ],
      });

      // Wait for transaction to be confirmed
      const committedTransactionResponse = await aptos.waitForTransaction({
        transactionHash: tx?.hash as string,
      });

      if (committedTransactionResponse.success) {
        // Check subscription status after successful purchase
        const hasSubscriptionActiveResult = await abi
          ?.useABI(subscriptionABI)
          .view.has_subscription_active({
            typeArguments: [],
            functionArguments: [walletAddress as `0x${string}`],
          });

        const hasSubscriptionActive =
          hasSubscriptionActiveResult?.[0] as boolean;
        setIsSubscriptionActive(hasSubscriptionActive);

        if (hasSubscriptionActive) {
          const subscriptionResult = await abi
            ?.useABI(subscriptionABI)
            .view.get_plan({
              typeArguments: [],
              functionArguments: [walletAddress as `0x${string}`],
            });

          const subscription = subscriptionResult?.[1];

          if (subscription?.[1]) {
            const expireDate = parseInt(subscription) * 1000;
            setExpirationDate(
              new Date(expireDate).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            );
          }
        }

        toast({
          title: 'Subscribe',
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
      }
    } catch (error) {
      toast({
        title: 'Error subscribing',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const startFreeTrial = async () => {
    try {
      // Free trial duration - 2 days
      const duration = 2 * 24 * 60 * 60;

      const tx = await client?.useABI(subscriptionABI).buy_plan({
        type_arguments: [],
        arguments: [duration, nftAddressesRequiredOwned as `0x${string}`[]],
      });

      // Wait for transaction to be confirmed
      const committedTransactionResponse = await aptos.waitForTransaction({
        transactionHash: tx?.hash as string,
      });

      if (committedTransactionResponse.success) {
        // Check subscription status after successful purchase
        const hasSubscriptionActiveResult = await abi
          ?.useABI(subscriptionABI)
          .view.has_subscription_active({
            typeArguments: [],
            functionArguments: [walletAddress as `0x${string}`],
          });

        const hasSubscriptionActive =
          hasSubscriptionActiveResult?.[0] as boolean;
        setIsSubscriptionActive(hasSubscriptionActive);

        if (hasSubscriptionActive) {
          const subscriptionResult = await abi
            ?.useABI(subscriptionABI)
            .view.get_plan({
              typeArguments: [],
              functionArguments: [walletAddress as `0x${string}`],
            });

          const subscription = subscriptionResult?.[1];

          if (subscription?.[1]) {
            const expireDate = parseInt(subscription) * 1000;
            setExpirationDate(
              new Date(expireDate).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            );
          }
        }

        toast({
          title: 'Free Trial Started',
          description: (
            <a
              href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View transaction
            </a>
          ),
        });
      } else {
        toast({
          title: 'Error starting free trial',
          description: 'Transaction failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error starting free trial',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const setAppRunning = (isRunning: boolean) => {
    setIsAppRunning(isRunning);
    // In a real implementation, you might want to persist this to a backend
  };

  const values = {
    isAdmin,
    setIsAdmin,
    isPendingAdmin,
    setIsPendingAdmin,
    isCollector,
    setIsCollector,
    resourceAccount,
    setResourceAccount,
    currencies,
    setCurrencies,
    moveBotsOwned,
    qribbleNFTsOwned,
    sshiftRecordsOwned,
    nftAddressesRequiredOwned,
    onSubscribe,
    startFreeTrial,
    isSubscriptionActive,
    setIsSubscriptionActive,
    expirationDate,
    isReviewer,
    setIsReviewer,
    isPendingReviewer,
    setIsPendingReviewer,
    hasSubscriptionToClaim,
    setHasSubscriptionToClaim,
    isAppRunning,
    setAppRunning,
  };

  return (
    <AppManagmentContext.Provider value={values}>
      {children}
    </AppManagmentContext.Provider>
  );
};

export const useAppManagment = () => {
  return useContext(AppManagmentContext);
};
