import React from 'react';
import { SubscriptionContainer } from './SubscriptionContainer';
import { UserProfileContainer } from './UserProfileContainer';
import { SubscriptionUpgradeContainer } from './SubscriptionUpgradeContainer';
import UserDashboardTitle from './UserDashboardTitle';

interface DashboardDisplayAreaProps {
  days: number;
  setDays: React.Dispatch<React.SetStateAction<number>>;
  price: number;
  dates: { startDate: string; expirationDate: string };
  discount: number;
  moveBotsOwned: number;
  qribbleNFTsOwned: number;
  sshiftRecordsOwned: number;
}

const DashboardDisplayArea: React.FC<DashboardDisplayAreaProps> = ({
  days,
  setDays,
  price,
  dates,
  discount,
  moveBotsOwned,
  qribbleNFTsOwned,
  sshiftRecordsOwned,
}) => {
  return (
    <div className="flex flex-col items-center w-full">
      <UserDashboardTitle />
      <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-8 lg:space-y-0 w-full items-center justify-center mb-8">
        {/* Subscription Container */}
        <SubscriptionContainer
          days={days}
          setDays={setDays}
          price={price}
          dates={dates}
          discount={discount}
        />

        {/* User Profile Container */}
        <UserProfileContainer
          moveBotsOwned={moveBotsOwned}
          qribbleNFTsOwned={qribbleNFTsOwned}
          sshiftRecordsOwned={sshiftRecordsOwned}
        />

        {/* Subscription Upgrade Container */}
        <SubscriptionUpgradeContainer />
      </div>
    </div>
  );
};

export default DashboardDisplayArea;
