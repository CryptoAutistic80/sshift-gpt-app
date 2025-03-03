'use client';
import { useAppManagment } from '../../src/context/AppManagment';
import AGIThoughtBackground from '../../src/components/ui/agiThought';
import DashboardHeader from '../../src/components/ui/DashboardHeader';
import Link from 'next/link';
import { ClaimSubscripton } from './claimSubscription';

const ClaimSubscriptionPage = () => {
  const { hasSubscriptionToClaim } = useAppManagment();

  return (
    <div>
      <AGIThoughtBackground />
      <DashboardHeader />
      {!hasSubscriptionToClaim ? (
        <div className="flex justify-center mt-20">
          <div className="w-[500px] bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Not subscription to claim
              </h2>
              <p className="mt-4 text-gray-600">
                You do not have a subscription to claim. Please check your
                subscription status in your{' '}
                <Link href="/dashboard">Dashboard</Link>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 min-w-[700px] justify-self-center mt-20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Fund Managment</h2>
          </div>
          <ClaimSubscripton />
        </div>
      )}
    </div>
  );
};

export default ClaimSubscriptionPage;
