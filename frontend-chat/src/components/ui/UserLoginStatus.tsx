import React from 'react';
import { SshiftWalletDisconnect } from '../SshigtWallet';
import { Wallet } from 'lucide-react';

const UserLoginStatus: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 min-[1010px]:w-2.5 min-[1010px]:h-2.5 bg-blue-500 rounded-full"></div>
      <span className="hidden min-[1010px]:inline text-gray-800 font-semibold">Connected</span>
      <SshiftWalletDisconnect />
    </div>
  );
};

export default UserLoginStatus;
