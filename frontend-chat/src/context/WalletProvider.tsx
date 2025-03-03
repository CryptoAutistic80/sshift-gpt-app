'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PropsWithChildren } from 'react';
import { AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { APTOS_INDEXER, APTOS_NETWORK, APTOS_NODE_URL } from '../../config/env';
import { useChain } from './ChainProvider';

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const { aptos } = useChain();

  return (
    <AptosWalletAdapterProvider
      dappConfig={
        new AptosConfig({
          network:
            APTOS_NETWORK === 'mainnet' ? Network.MAINNET : Network.TESTNET,
          fullnode: aptos?.config?.fullnode || APTOS_NODE_URL,
          indexer: aptos?.config?.indexer || APTOS_INDEXER,
        })
      }
      onError={(error) => {
        console.error('Error in wallet adapter:', error);
      }}
      autoConnect={true}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
