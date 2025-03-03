'use client';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AgentRuntime, WalletSigner } from 'move-agent-kit-fullstack';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { PANORA_API_KEY } from '../../config/env';
import { Account, Network } from '@aptos-labs/ts-sdk';
import { useChain } from './ChainProvider';
import { getAptosClient } from '@aptos';

type Agent = {
  agent: AgentRuntime;
};

const AgentContext = createContext<Agent>({} as Agent);

export const AgentProvider = ({ children }: { children: React.ReactNode }) => {
  const [agent, setAgent] = useState<AgentRuntime>({} as AgentRuntime);
  const { walletAddress } = useAuth();
  const wallet = useWallet();
  const { aptos } = useChain();

  useEffect(() => {
    if (!walletAddress || !aptos) return;

    const signer = new WalletSigner({} as Account, wallet);

    const aptosConfig = getAptosClient(
      aptos.config.fullnode as string,
      aptos.config.indexer as string,
      Network.MAINNET
    );

    const agentInstance = new AgentRuntime(signer, aptosConfig, {
      PANORA_API_KEY,
    });

    setAgent(agentInstance);
  }, [walletAddress, aptos]);

  const values = { agent };

  return (
    <AgentContext.Provider value={values}>{children}</AgentContext.Provider>
  );
};

export const useAgent = () => {
  return useContext(AgentContext);
};
