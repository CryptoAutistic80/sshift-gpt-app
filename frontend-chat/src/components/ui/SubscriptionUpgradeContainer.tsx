import React from 'react';
import { Sparkles } from 'lucide-react';

export const SubscriptionUpgradeContainer = () => {
  return (
    <div className="w-full max-w-[400px] h-[600px] bg-white bg-opacity-90 p-6 lg:p-10 rounded-xl shadow-lg border border-gray-300 flex flex-col">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          <h2 className="mt-6 text-2xl lg:text-3xl font-extrabold text-gray-900">
            Upgrade Subscription
          </h2>
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </div>
        <p className="mt-2 text-sm text-gray-600">Unlock premium features</p>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-gray-400 text-center font-semibold">
            Coming soon - under development
          </p>
        </div>
        <div className="space-y-3 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <p>Enhanced AI capabilities</p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <p>Additional models</p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <p>Exclusive features access</p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <p>Access to SOTA models</p>
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <button
          disabled
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
        >
          Coming Soon
        </button>
      </div>
    </div>
  );
};
