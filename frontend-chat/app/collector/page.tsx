'use client';
import { useAppManagment } from '../../src/context/AppManagment';
import AGIThoughtBackground from '../../src/components/ui/agiThought';
import DashboardHeader from '../../src/components/ui/DashboardHeader';
import { FundManage } from './fundManage';

const CollectorPage = () => {
  const { isCollector } = useAppManagment();

  return (
    <div>
      <AGIThoughtBackground />
      <DashboardHeader />
      {!isCollector ? (
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
      ) : (
        <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 min-w-[700px] justify-self-center">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Fund Managment</h2>
          </div>
          <FundManage />
        </div>
      )}
    </div>
  );
};

export default CollectorPage;
