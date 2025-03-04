'use client';
import { useAppManagment } from '../../src/context/AppManagment';
import AGIThoughtBackground from '../../src/components/ui/agiThought';
import DashboardHeader from '../../src/components/ui/DashboardHeader';
import { PendingActions } from '../pendingActions';
import { ChangeReviewer } from './changeReviewer';

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
        <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 min-w-[700px] justify-self-center">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Change reviewer
            </h2>
          </div>
          <ChangeReviewer />
        </div>
      )}

      {isReviewer && (
        <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 min-w-[700px] justify-self-center">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Pending actions
            </h2>
          </div>
          <PendingActions />
        </div>
      )}
    </div>
  );
};

export default ReviewerPage;
