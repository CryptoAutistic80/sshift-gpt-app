'use client';

import Image from 'next/image';
import { silkscreen } from './fonts';
import { SshiftWallet } from '../src/components/SshigtWallet';
import { GameOfLife } from '../src/components/ui/gameOfLife';
import { IndexHeader } from '../src/components/ui/IndexHeader';
import { NetworkToggle } from '../src/components/ui/NetworkToggle';
import { useEffect, useState } from 'react';
import { Chain } from '@helpers';
import { useChain } from '../src/context/ChainProvider';

export default function Home() {
  const [selectedNetwork, setSelectedNetwork] = useState<Chain>(Chain.Aptos);
  const { createChainClient, chain } = useChain();

  const handleNetworkToggle = () => {
    setSelectedNetwork(
      selectedNetwork === Chain.Aptos ? Chain.Movement : Chain.Aptos
    );

    createChainClient(
      selectedNetwork === Chain.Aptos ? Chain.Movement : Chain.Aptos
    );
  };

  useEffect(() => {
    if (!chain) return;
    setSelectedNetwork(chain);
  }, [chain]);

  return (
    <div className="relative min-h-screen">
      <GameOfLife />
      <IndexHeader />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="flex flex-col md:flex-row items-center mb-4 md:mb-8">
          <div className="relative w-40 h-40 md:w-64 md:h-64 mb-4 md:mb-0 md:mr-8">
            <Image
              src="/images/sshift-logo-animated.gif"
              alt="SShift GPT Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
              unoptimized
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1
              className={`text-4xl md:text-6xl font-bold text-gray-800 leading-tight text-center ${silkscreen.className}`}
            >
              Welcome to
              <br />
              SShift GPT
            </h1>
          </div>
        </div>

        <NetworkToggle
          selectedNetwork={selectedNetwork}
          onToggle={handleNetworkToggle}
        />

        <div className="flex space-x-2 md:space-x-4">
          <SshiftWallet />
        </div>
        <div className="flex space-x-4 mt-4">
          <a
            href={process.env.NEXT_PUBLIC_DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors"
            aria-label="Join Discord"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>
          <a
            href={process.env.NEXT_PUBLIC_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-[#0088cc] text-white rounded-lg hover:bg-[#0077b3] transition-colors"
            aria-label="Join Telegram"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.225-.461-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.062 3.345-.48.33-.913.49-1.302.48-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.333-1.386 4.025-1.627 4.477-1.635.4-.006 1.29.235 1.655.774z" />
            </svg>
          </a>
          <a
            href={process.env.NEXT_PUBLIC_GITBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-[#3884FF] text-white rounded-lg hover:bg-[#2D6ECC] transition-colors"
            aria-label="View Documentation"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10.802 17.77a.703.703 0 11-.002 1.406.703.703 0 01.002-1.406m11.024-4.347a.703.703 0 11.001-1.406.703.703 0 01-.001 1.406m0-2.876a2.176 2.176 0 00-2.174 2.174c0 .233.039.465.115.691l-7.181 3.823a2.165 2.165 0 00-1.784-.937c-.829 0-1.584.475-1.95 1.216l-6.451-3.402c-.682-.358-1.192-1.48-1.138-2.502.028-.533.212-.947.493-1.107.178-.1.392-.092.62.027l.042.023c1.71.9 7.304 3.847 7.54 3.956.363.169.565.237 1.185-.057l11.564-6.014c.17-.064.368-.227.368-.474 0-.342-.354-.477-.355-.477-.658-.315-1.669-.788-2.655-1.25-2.108-.987-4.497-2.105-5.546-2.655-.906-.474-1.635-.074-1.765.006l-.252.125C7.78 6.048 1.46 9.178 1.1 9.397.457 9.789.058 10.57.006 11.539c-.08 1.537.703 3.14 1.824 3.727l6.822 3.518a2.175 2.175 0 002.15 1.862 2.177 2.177 0 002.173-2.14l7.514-4.073c.38.298.853.461 1.337.461a2.176 2.176 0 000-4.352" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
