'use client';

import React from 'react';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';
import UserLoginStatus from './UserLoginStatus';
import { useAppManagment } from '../../context/AppManagment';
import { useRouter, usePathname } from 'next/navigation';

const DashboardHeader = () => {
  const {
    isAdmin,
    isPendingAdmin,
    isCollector,
    isReviewer,
    isPendingReviewer,
    isSubscriptionActive,
  } = useAppManagment();
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <div className="bg-white bg-opacity-90 shadow-sm py-2 px-4 flex flex-row justify-between items-center min-h-[60px] relative z-10">
      <div className="flex items-center gap-2">
        {(isSubscriptionActive || isCollector) && (
          <Button
            onClick={() => router.push('/chat')}
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Chat</span>
          </Button>
        )}

        {(isAdmin || isPendingAdmin) && pathname !== '/admin' && (
          <Button
            onClick={() => router.push('/admin')}
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Admin</span>
          </Button>
        )}

        {isCollector && pathname !== '/collector' && (
          <Button
            onClick={() => router.push('/collector')}
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Collector</span>
          </Button>
        )}

        {(isReviewer || isPendingReviewer) && pathname !== '/reviewer' && (
          <Button
            onClick={() => router.push('/reviewer')}
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Reviewer</span>
          </Button>
        )}

        {pathname !== '/dashboard' && (
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
        )}

        {!isAdmin && !isCollector && !isReviewer && pathname !== '/claim' && (
          <Button
            onClick={() => router.push('/claim')}
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Claim</span>
          </Button>
        )}
      </div>
      <div>
        <UserLoginStatus />
      </div>
    </div>
  );
};

export default DashboardHeader;
