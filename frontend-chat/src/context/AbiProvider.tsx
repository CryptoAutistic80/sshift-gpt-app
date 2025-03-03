'use client';
import { DefaultABITable } from '@thalalabs/surf';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Client } from '@thalalabs/surf/build/types/core/Client';
import {
  FeesABI,
  FeesMoveAbi,
  SubscriptionABI,
  SubscriptionMoveABI,
  abis as surfClient,
} from '@aptos';
import { useChain } from './ChainProvider';
import { Chain, FeesABITypes, SubscriptionABITypes } from '@helpers';
import { APTOS_INDEXER, APTOS_NODE_URL } from 'frontend-chat/config/env';

export type AbiContextProp = {
  abi: Client<DefaultABITable> | undefined;
  feesABI: FeesABITypes;
  subscriptionABI: SubscriptionABITypes;
};

const AbiContext = createContext<AbiContextProp>({} as AbiContextProp);

export const AbiProvider = ({ children }: { children: ReactNode }) => {
  const [abi, setAbi] = useState<Client<DefaultABITable>>();
  const [feesABI, setFeesABI] = useState<FeesABITypes>(FeesABI);
  const [subscriptionABI, setSubscriptionABI] =
    useState<SubscriptionABITypes>(SubscriptionABI);
  const { aptos, chain } = useChain();

  useEffect(() => {
    if (!aptos) return;

    setFeesABI(chain === Chain.Aptos ? FeesABI : FeesMoveAbi);
    setSubscriptionABI(
      chain === Chain.Aptos ? SubscriptionABI : SubscriptionMoveABI
    );

    setAbi(
      surfClient(
        aptos.config?.fullnode || (APTOS_NODE_URL as string),
        aptos.config?.indexer || (APTOS_INDEXER as string)
      )
    );
  }, [aptos, chain]);

  const values = { abi, feesABI, subscriptionABI };

  return <AbiContext.Provider value={values}>{children}</AbiContext.Provider>;
};

export const useAbiClient = () => {
  return useContext(AbiContext);
};
