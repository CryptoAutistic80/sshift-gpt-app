'use client';
import { useAppManagment } from '../../src/context/AppManagment';
import AGIThoughtBackground from '../../src/components/ui/agiThought';
import DashboardHeader from '../../src/components/ui/DashboardHeader';
import { PendingActions } from '../pendingActions';
import { ChangeReviewer } from './changeReviewer';
import { EnhancedFees } from '../admin/enhancedFees';
import CoinsV1PaymentBox from '../../src/components/payment/CoinsV1PaymentBox';
import AppStatusControl from '../../src/components/admin/AppStatusControl';

const ReviewerPage = () => {
  const { isReviewer, isPendingReviewer } = useAppManagment();

  return (
    <div>
      <AGIThoughtBackground />
      <DashboardHeader />
      {!isReviewer && !isPendingReviewer && (
        <div className="flex justify-center">
          <div className="w-[500px] bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Unauthorized Access
              </h2>
              <p className="mt-4 text-gray-600">
                You do not have permission to view this page.
              </p>
            </div>
          </div>
        </div>
      )}

      {(isReviewer || isPendingReviewer) && (
        <div className="max-w-[1600px] mx-auto px-4 space-y-8">
          <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Change reviewer
              </h2>
            </div>
            <ChangeReviewer />
          </div>

          {isReviewer && (
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Fees Management
                </h2>
              </div>
              <EnhancedFees isReviewerMode={true} disableAddCurrency={true} />
            </div>
          )}

          {isReviewer && (
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Pending actions
                </h2>
              </div>
              <PendingActions />
            </div>
          )}

          {isReviewer && (
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Coins V1 Payment</h2>
                <p className="text-sm text-gray-600 mt-1">Distribute coins to collectors</p>
              </div>
              <CoinsV1PaymentBox />
            </div>
          )}

          {isReviewer && (
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  App Status Control
                </h2>
                <AppStatusControl />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewerPage;
