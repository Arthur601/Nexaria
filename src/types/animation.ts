import { CurrencyType } from './rpg';

export type TransactionAnimationType = 'sending' | 'receiving' | 'insufficient_funds';

export interface TransactionAnimationData {
  id: string;
  type: TransactionAnimationType;
  currency: CurrencyType;
  amount: number;
  senderName: string;
  receiverName: string;
  reason?: string;
  currentBalance?: number;
  shortage?: number;
  timestamp: number;
}
