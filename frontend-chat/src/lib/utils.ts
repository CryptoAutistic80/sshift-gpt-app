import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import config from '../../config/dashboard_config.json'; // Adjust the path as necessary
import { APTOS_INDEXER, APTOS_NETWORK, APTOS_NODE_URL } from '../../config/env';
import { AgentRuntime } from 'move-agent-kit-fullstack';
import { executeAction } from '@helpers';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculatePrice(days: number) {
  const minPrice = config.MIN_PRICE; // Price for 1 day
  const maxPrice = config.MAX_PRICE; // Price for 30 days
  const maxDays = config.MAX_DAYS;

  if (days === 1) return minPrice;
  if (days === maxDays) return maxPrice;

  // Calculate the exponent that satisfies our constraints
  const exponent = Math.log(maxPrice / minPrice) / Math.log(maxDays);

  // Calculate the price using the power function
  const price = minPrice * Math.pow(days, exponent);

  return parseFloat(price.toFixed(2));
}

function formatUTCDate(date: Date): string {
  return date.toUTCString().replace('GMT', 'UTC');
}

export function calculateDates(days: number): {
  startDate: string;
  expirationDate: string;
} {
  const startDate = new Date();
  const expirationDate = new Date(
    startDate.getTime() + days * 24 * 60 * 60 * 1000
  );

  return {
    startDate: formatUTCDate(startDate),
    expirationDate: formatUTCDate(expirationDate),
  };
}

export function calculateDiscount(
  owned: number,
  days: number,
  collectionType: 'Qribbles' | 'ShiftRecords' | 'MoveBots'
): number {
  const discountRate = config.DISCOUNTS[collectionType];
  const discountPerDay = discountRate * owned;
  const totalDiscountAmount = discountPerDay * days;
  return totalDiscountAmount;
}

export function calculateMaxDiscount(
  moveBotsOwned: number,
  qribbleNFTsOwned: number,
  sshiftRecordsOwned: number,
  days: number
): number {
  // If user owns any MoveBots, they get 50% discount
  if (moveBotsOwned > 0) {
    return config.MAX_DISCOUNT;
  }

  const basePrice = calculatePrice(days);
  const maxDiscountAmount = basePrice / 2; // 50% of base price in USDT

  const moveBotDiscount = calculateDiscount(moveBotsOwned, days, 'MoveBots');
  const qribbleDiscount = calculateDiscount(qribbleNFTsOwned, days, 'Qribbles');
  const sshiftRecordDiscount = calculateDiscount(
    sshiftRecordsOwned,
    days,
    'ShiftRecords'
  );

  // Get highest discount amount
  const highestDiscountAmount = Math.max(
    moveBotDiscount,
    qribbleDiscount,
    sshiftRecordDiscount
  );

  // Convert discount amount to percentage
  const discountPercentage =
    (Math.min(highestDiscountAmount, maxDiscountAmount) / basePrice) * 100;

  return Math.min(discountPercentage, config.MAX_DISCOUNT);
}

export const executeAllActions = async (actions: any, agent: AgentRuntime) => {
  for (const action of actions) {
    const { name, args } = action;

    await executeAction(name, args, agent);
  }
};
