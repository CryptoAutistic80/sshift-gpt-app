import { cn } from '../lib/utils';
import { Spinner } from './ui/spinner';
import { FC } from 'react';

export const LoadingSpinner: FC<{ on: boolean }> = ({ on }) => {
  return (
    <div
      className={cn(
        'top-0 left-0 fixed w-full h-full bg-gray-500 bg-opacity-30 flex justify-center items-center flex-col transition-all',
        on ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
      )}
    >
      <p className="display">...Loading</p>
      <Spinner size="lg" />
    </div>
  );
};
