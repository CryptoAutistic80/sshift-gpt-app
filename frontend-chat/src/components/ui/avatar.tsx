'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { memo } from 'react'; // Import memo

import { cn } from '../../lib/utils';

// Wrap Avatar component with memo
const Avatar = memo(React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200 shadow-[0_4px_8px_-1px_rgba(0,0,0,0.2)]',
      className
    )}
    {...props}
  />
)));
Avatar.displayName = AvatarPrimitive.Root.displayName;

// Wrap AvatarImage component with memo
const AvatarImage = memo(React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    src="/images/sshift-guy.png" // Updated path to the static image
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
)));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

// Wrap AvatarFallback component with memo
const AvatarFallback = memo(React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
)));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
