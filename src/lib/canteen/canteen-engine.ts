/**
 * Campus Canteen & Smart-Card Cafeteria POS Engine
 * Handles meal pricing, nutritional computation, RFID wallet balance validation, and order token generation.
 */

export type MenuCategory = "BREAKFAST" | "LUNCH_SPECIAL" | "HEALTHY_BOWLS" | "SNACKS" | "BEVERAGES";
export type OrderStatus = "PREPARING" | "READY_FOR_PICKUP" | "COLLECTED";
export type WalletTxType = "DEBIT_PURCHASE" | "CREDIT_TOPUP" | "REFUND";

export interface CanteenMenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  calories: number;
  isVeg: boolean;
  isGlutenFree: boolean;
  availableStock: number;
  prepTimeMins: number;
  description: string;
}

export interface MealWalletAccount {
  userId: string;
  userFullName: string;
  userRole: string;
  rfidCardId: string;
  currentBalance: number;
  dailySpendingLimit: number;
  autoRechargeThreshold: number;
  status: "ACTIVE" | "FROZEN";
}

export interface CanteenOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  calories: number;
}

export interface CanteenOrder {
  orderId: string;
  orderToken: string;
  userId: string;
  customerName: string;
  items: CanteenOrderItem[];
  subtotalAmount: number;
  discountApplied: number;
  totalAmount: number;
  paymentMethod: "MEAL_WALLET" | "CAMPUS_UPI" | "CASH_COUNTER";
  status: OrderStatus;
  counterNo: number;
  placedAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTxType;
  amount: number;
  balanceAfter: number;
  reference: string;
  timestamp: string;
}

/**
 * Calculates order subtotal, institutional student/staff discount, and net payable.
 */
export function calculateOrderTotal(
  items: { menuItem: CanteenMenuItem; quantity: number }[],
  userRole: string = "STUDENT"
): { subtotal: number; discount: number; finalTotal: number } {
  const subtotal = items.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);

  // Campus welfare subsidy: 10% student subsidy on healthy items, 5% for staff
  const subsidyRate = userRole === "STUDENT" ? 0.1 : 0.05;
  const discount = Math.round(subtotal * subsidyRate * 100) / 100;
  const finalTotal = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  return { subtotal, discount, finalTotal };
}

/**
 * Validates whether the RFID meal wallet has sufficient balance.
 */
export function validateWalletBalance(
  wallet: MealWalletAccount,
  amountToDeduct: number
): { canAfford: boolean; remainingBalance: number; reason?: string } {
  if (wallet.status !== "ACTIVE") {
    return { canAfford: false, remainingBalance: wallet.currentBalance, reason: "RFID Card is temporarily suspended" };
  }

  if (amountToDeduct > wallet.dailySpendingLimit) {
    return { canAfford: false, remainingBalance: wallet.currentBalance, reason: "Order exceeds daily contactless spending ceiling" };
  }

  if (wallet.currentBalance < amountToDeduct) {
    return {
      canAfford: false,
      remainingBalance: wallet.currentBalance,
      reason: `Insufficient wallet balance ($${wallet.currentBalance.toFixed(2)}). Please top up.`,
    };
  }

  return {
    canAfford: true,
    remainingBalance: Math.round((wallet.currentBalance - amountToDeduct) * 100) / 100,
  };
}

/**
 * Generates institutional cafeteria order pickup token.
 */
export function generateOrderToken(orderSequence: number): string {
  const padded = String(orderSequence).padStart(3, "0");
  return `#CAN-${padded}`;
}

/**
 * Computes nutritional aggregated metrics for order.
 */
export function calculateNutritionalSummary(
  items: { menuItem: CanteenMenuItem; quantity: number }[]
): { totalCalories: number; vegOnly: boolean } {
  const totalCalories = items.reduce((acc, curr) => acc + curr.menuItem.calories * curr.quantity, 0);
  const vegOnly = items.every((i) => i.menuItem.isVeg);
  return { totalCalories, vegOnly };
}
