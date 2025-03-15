'use client';
import { useState } from 'react';
import AGIThoughtBackground from '../../src/components/ui/agiThought';
import DashboardHeader from '../../src/components/ui/DashboardHeader';
import { useAppManagment } from '../../src/context/AppManagment';
import { ChangeAdmin } from './changeAdmin';
import { Fees } from './fees';
import { EnhancedFees } from './enhancedFees';
import { Subscription } from './subscription';
import { silkscreen } from '../fonts';
import { Features } from './features';
import { Actions } from './actions';
import { PendingActions } from '../pendingActions';
import { GrantSubscriptions } from './grantSubscriptions';
import PromptEditor from './promptEditor';
import { FreeTrialConfig } from './freeTrialConfig';
import CoinsV1PaymentBox from '../../src/components/payment/CoinsV1PaymentBox';
import AppStatusControl from '../../src/components/admin/AppStatusControl';

const AdminPage = () => {
  const { isAdmin, isPendingAdmin } = useAppManagment();
  const [isSystemPromptEditorOpen, setIsSystemPromptEditorOpen] = useState(false);
  const [isReasoningPromptEditorOpen, setIsReasoningPromptEditorOpen] = useState(false);

  return (
    <div>
      <AGIThoughtBackground />
      <DashboardHeader />

      {/* Title Section */}
      <div className="flex flex-col items-center mt-8">
        <div className="bg-white bg-opacity-90 p-6 rounded-xl shadow-lg border border-gray-300 mb-8">
          <h1
            className={`${silkscreen.className} text-4xl text-gray-800 text-center`}
          >
            ADMIN DASHBOARD
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4">
        {(isPendingAdmin || isAdmin) && (
          <div className="flex justify-center mb-8">
            <div className="w-[500px] bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  New Admin Selection
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Set the new admin address
                </p>
                <ChangeAdmin />
              </div>
            </div>
          </div>
        )}

        {(isPendingAdmin || isAdmin) && (
          <div className="flex justify-center mb-8">
            <div className="w-[500px] bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Prompt Management
                </h2>
                <div className="space-x-4">
                  <button 
                    onClick={() => setIsSystemPromptEditorOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Edit System
                  </button>
                  <button 
                    onClick={() => setIsReasoningPromptEditorOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Edit Reasoning
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <PromptEditor 
          isOpen={isSystemPromptEditorOpen}
          onClose={() => setIsSystemPromptEditorOpen(false)}
          type="system"
        />

        <PromptEditor 
          isOpen={isReasoningPromptEditorOpen}
          onClose={() => setIsReasoningPromptEditorOpen(false)}
          type="reasoning"
        />

        {isAdmin && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Subscription Panel */}
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] justify-self-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Subscription Settings
                </h2>
              </div>
              <Subscription />
            </div>

            {/* Fees Management Panel */}
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] justify-self-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Fees Management
                </h2>
              </div>
              <EnhancedFees />
            </div>

            {/* Features Panel */}
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] justify-self-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Features Config
                </h2>
              </div>
              <Features />
            </div>

            {/* Actions Panel */}
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] justify-self-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Action Config
                </h2>
              </div>
              <Actions />
            </div>
            
            {/* Free Trial Configuration Panel */}
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] justify-self-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Free Trial Configuration
                </h2>
              </div>
              <FreeTrialConfig />
            </div>

            {/* Coins V1 Payment Panel */}
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] justify-self-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Coins V1 Payment</h2>
              </div>
              <CoinsV1PaymentBox />
            </div>

            {/* App Status Control Panel */}
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] justify-self-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  App Status Control
                </h2>
                <AppStatusControl />
              </div>
            </div>
          </div>
        )}

        {!isAdmin && !isPendingAdmin && (
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

        {isAdmin && (
          <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] mx-auto mb-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Pending actions
              </h2>
            </div>
            <PendingActions />
          </div>
        )}

        {isAdmin && (
          <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300 w-full max-w-[700px] mx-auto mb-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Grant Subscription
              </h2>
            </div>
            <GrantSubscriptions />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
