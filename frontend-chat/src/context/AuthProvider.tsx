'use client';
import {
  useState,
  useEffect,
  createContext,
  ReactNode,
  useContext,
} from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { IAuth, IJwt, IJWTUser } from '@helpers';
import * as jwtoken from 'jsonwebtoken';
import { usePathname, useRouter } from 'next/navigation';
import { DataProtection } from '../content/DataProtection';
import backend from '../services/backend';
import { useChain } from './ChainProvider';
import { AccountAddress } from '@aptos-labs/ts-sdk';

export type AuthContextProp = {
  jwt: string;
  walletAddress: string;
  handleDisconnect: () => void;
};

const AuthContext = createContext<AuthContextProp>({} as AuthContextProp);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [jwt, setJwt] = useState<string>('');
  const { signMessage, account, connected, disconnect, wallet } = useWallet();
  const { chain } = useChain();
  const [walletAddress, setWalletAddress] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const getJwt = () => {
    try {
      const item = window.localStorage.getItem('jwt');

      if (item) {
        return JSON.parse(item) as IJWTUser[];
      }

      return;
    } catch (error) {
      window.localStorage.removeItem('jwt');
      return;
    }
  };

  const sigIn = async (): Promise<IJwt | undefined> => {
    if (!connected) return;

    try {
      const message = DataProtection;

      const messageResp = await signMessage({
        message,
        nonce: Math.random().toString(),
      });

      if (
        (messageResp.signature as any)?.data &&
        (messageResp.signature as any)?.data?.data instanceof Uint8Array ===
          false
      ) {
        const dataSignature = new Uint8Array(
          Object.values((messageResp.signature as any).data.data)
        );

        messageResp.signature = Buffer.from(dataSignature).toString(
          'hex'
        ) as any;
      }

      const payload: IAuth = {
        message: messageResp.fullMessage,
        signature: `${messageResp.signature}`,
        address: account?.address.toString() as `0x${string}}`,
        chain,
        publicKey: account?.publicKey.toString() as string,
      };

      const response = await backend.post('/auth/login', { ...payload });

      return response.data;
    } catch (error) {
      throw new Error(`Error signing in: ${error}`);
    }
  };

  const handleConnectWallet = async (
    storedValues: IJWTUser[] | undefined,
    address: string
  ) => {
    try {
      const jwtAuth = storedValues?.find(
        (s) => s.account === address && s.chain === chain
      );

      let authObj: IJwt | undefined;

      if (!jwtAuth) {
        authObj = await sigIn();

        if (!authObj?.authToken) {
          console.warn('Error signing in');

          await handleDisconnect();
          return;
        }

        setJwt(authObj.authToken);

        const jwtUser: IJWTUser = {
          account: account?.address.toString() || '',
          chain,
          token: authObj.authToken,
        };

        window.localStorage.setItem(
          'jwt',
          JSON.stringify(
            storedValues?.length
              ? [...(storedValues as IJWTUser[]), jwtUser]
              : [jwtUser]
          )
        );
      } else {
        setJwt(jwtAuth?.token);
      }

      const payload = jwtoken.decode(
        jwtAuth?.token || (authObj?.authToken as string)
      ) as {
        address: string;
      };

      if (payload && payload.address === address && wallet) {
        setWalletAddress(address);
        if (pathname === '/') {
          router.push('/dashboard');
        }
      } else {
        await handleDisconnect();
      }
    } catch (error) {
      console.log('Error handling wallet connection:', error);
      await handleDisconnect();
    }
  };

  const handleDisconnect = async () => {
    console.log('User disconnected');
    setJwt('');
    const storedValue = getJwt();

    if (!storedValue?.length) {
      return;
    }

    if (storedValue?.some((s) => s.account === account?.address.toString())) {
      localStorage.setItem(
        'jwt',
        JSON.stringify(
          storedValue?.filter((s) => s.account !== walletAddress) as IJWTUser[]
        )
      );

      if (connected) await disconnect();
    }

    router.push('/');
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !account?.address || !connected) {
      return;
    }

    const storedValue = getJwt();

    handleConnectWallet(storedValue, account?.address.toString());
  }, [connected, account]);

  const value: AuthContextProp = { jwt, walletAddress, handleDisconnect };

  return (
    <AuthContext.Provider value={value as AuthContextProp}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
