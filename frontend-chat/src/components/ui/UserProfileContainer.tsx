import React from 'react';
import { Input } from './input';
import Link from 'next/link';
import config from '../../../config/dashboard_config.json';
import { useAppManagment } from '../../../src/context/AppManagment';
import { Button } from './button';
import { useRouter } from 'next/navigation';
import { silkscreen } from '../../../app/fonts';
import { useChain } from '../../context/ChainProvider';
import { Chain } from '@helpers';

interface UserProfileContainerProps {
  moveBotsOwned: number;
  qribbleNFTsOwned: number;
  sshiftRecordsOwned: number;
}

export const UserProfileContainer: React.FC<UserProfileContainerProps> = ({
  moveBotsOwned,
  qribbleNFTsOwned,
  sshiftRecordsOwned,
}) => {
  const { isSubscriptionActive, expirationDate } = useAppManagment();
  const router = useRouter();
  const { chain } = useChain();

  const handleEnterSShiftGPT = () => {
    router.push('/chat');
  };

  return (
    <div className="w-full max-w-[400px] h-[600px] bg-white bg-opacity-90 p-6 lg:p-10 rounded-xl shadow-lg flex flex-col border border-gray-300">
      <div>
        <div className="text-center">
          <h2 className="mt-6 text-2xl lg:text-3xl font-extrabold text-gray-900">
            User Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">&nbsp;</p>
        </div>
        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Subscription Status:
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                isSubscriptionActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isSubscriptionActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Expiry Date:
            </span>
            <div className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 w-56 text-right">
              <span className="text-sm text-gray-600">
                {isSubscriptionActive ? expirationDate : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow mt-16 space-y-4">
        {chain === Chain.Aptos && (
          <>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Move Bot owned:
                </span>
                <Link
                  href={config.MOVEBOT_BUY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-600 hover:text-gray-800 underline block"
                >
                  Buy
                </Link>
              </div>
              <Input
                type="number"
                value={moveBotsOwned}
                className="w-20 text-right bg-gray-100"
                readOnly
              />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  SShift Records owned:
                </span>
                <Link
                  href={config.SSHIFT_RECORDS_BUY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-600 hover:text-gray-800 underline block"
                >
                  Buy
                </Link>
              </div>
              <Input
                type="number"
                value={sshiftRecordsOwned}
                className="w-20 text-right bg-gray-100"
                readOnly
              />
            </div>
          </>
        )}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-gray-700">
              Qribble NFT owned:
            </span>
            <Link
              href={config.QRIBBLE_BUY}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-gray-800 underline block"
            >
              Buy
            </Link>
          </div>
          <Input
            type="number"
            value={qribbleNFTsOwned}
            className="w-20 text-right bg-gray-100"
            readOnly
          />
        </div>
      </div>

      <Button
        variant="default"
        className={`
          ${silkscreen.className}
          py-2
          px-3
          text-sm
          font-bold
          text-black
          bg-green-400
          hover:bg-green-500
          focus:outline-none
          focus:ring-2
          focus:ring-offset-2
          focus:ring-green-400
          transform
          transition-transform
          hover:scale-105
          rounded-xl
          shadow-lg
          border
          border-gray-700
          w-full
          whitespace-nowrap
          mt-auto
        `}
        onClick={handleEnterSShiftGPT}
      >
        ENTER SSHIFT GPT
      </Button>
    </div>
  );
};
