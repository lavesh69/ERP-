/**
 * Persistent Data Store for Campus Canteen & Smart Cafeteria POS
 * Stores menu items, wallet balances, live order tokens, and transactions in data/canteen/cafeteria_pos.json
 */

import fs from "fs";
import path from "path";
import {
  CanteenMenuItem,
  MealWalletAccount,
  CanteenOrder,
  WalletTransaction,
  calculateOrderTotal,
  validateWalletBalance,
  generateOrderToken,
} from "./canteen-engine";

const DATA_DIR = path.join(process.cwd(), "data", "canteen");
const STORE_FILE = path.join(DATA_DIR, "cafeteria_pos.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface CanteenStoreSchema {
  menu: CanteenMenuItem[];
  wallets: Record<string, MealWalletAccount>;
  orders: CanteenOrder[];
  transactions: WalletTransaction[];
  orderCounter: number;
}

const DEFAULT_MENU: CanteenMenuItem[] = [
  {
    id: "dish-01",
    name: "Crisp Masala Dosa & Coconut Chutney",
    category: "BREAKFAST",
    price: 4.5,
    calories: 380,
    isVeg: true,
    isGlutenFree: true,
    availableStock: 45,
    prepTimeMins: 6,
    description: "Traditional fermented crepe with spiced potato filling, lentil sambar, and fresh coconut chutney.",
  },
  {
    id: "dish-02",
    name: "Avocado & Multigrain Sourdough Toast",
    category: "BREAKFAST",
    price: 5.8,
    calories: 320,
    isVeg: true,
    isGlutenFree: false,
    availableStock: 30,
    prepTimeMins: 5,
    description: "Hass avocado smash, cherry tomatoes, micro-greens, chili flakes, and cold-pressed extra virgin olive oil.",
  },
  {
    id: "dish-03",
    name: "Gourmet Paneer Tikka Rice Bowl",
    category: "LUNCH_SPECIAL",
    price: 7.5,
    calories: 520,
    isVeg: true,
    isGlutenFree: true,
    availableStock: 50,
    prepTimeMins: 8,
    description: "Char-grilled cottage cheese cubes over saffron basmati rice, roasted pepper gravy, and pickled onions.",
  },
  {
    id: "dish-04",
    name: "Herb Grilled Chicken Caesar Salad",
    category: "LUNCH_SPECIAL",
    price: 8.2,
    calories: 440,
    isVeg: false,
    isGlutenFree: false,
    availableStock: 35,
    prepTimeMins: 7,
    description: "Tender chicken breast, crisp romaine hearts, parmesan shavings, garlic herb croutons, and light Greek yogurt dressing.",
  },
  {
    id: "dish-05",
    name: "Mediterranean Quinoa & Edamame Bowl",
    category: "HEALTHY_BOWLS",
    price: 6.9,
    calories: 390,
    isVeg: true,
    isGlutenFree: true,
    availableStock: 28,
    prepTimeMins: 5,
    description: "Organic tricolor quinoa, steamed edamame, cucumber ribbons, Kalamata olives, and lemon-tahini vinaigrette.",
  },
  {
    id: "dish-06",
    name: "Steamed Vegetable Momos & Chili Chutney",
    category: "SNACKS",
    price: 4.2,
    calories: 260,
    isVeg: true,
    isGlutenFree: false,
    availableStock: 60,
    prepTimeMins: 6,
    description: "Handcrafted steamed dumplings packed with finely shredded Asian greens and fiery smoked tomato chili chutney.",
  },
  {
    id: "dish-07",
    name: "Artisanal Cold Brew / Iced Latte",
    category: "BEVERAGES",
    price: 3.5,
    calories: 110,
    isVeg: true,
    isGlutenFree: true,
    availableStock: 80,
    prepTimeMins: 3,
    description: "Single-origin Arabica cold brewed for 18 hours, poured over ice with choice of organic dairy or oat milk.",
  },
  {
    id: "dish-08",
    name: "Immunity Booster Green Vitality Juice",
    category: "BEVERAGES",
    price: 4.0,
    calories: 95,
    isVeg: true,
    isGlutenFree: true,
    availableStock: 40,
    prepTimeMins: 3,
    description: "Cold-pressed granny smith apples, English cucumber, celery, baby spinach, ginger root, and lemon.",
  },
];

class CanteenStore {
  private data: CanteenStoreSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): CanteenStoreSchema {
    ensureDirectory();
    if (!fs.existsSync(STORE_FILE)) {
      const initial: CanteenStoreSchema = {
        menu: DEFAULT_MENU,
        wallets: {
          "usr-stu-01": {
            userId: "usr-stu-01",
            userFullName: "Alex Mercer",
            userRole: "STUDENT",
            rfidCardId: "RFID-APEX-882194",
            currentBalance: 42.5,
            dailySpendingLimit: 25.0,
            autoRechargeThreshold: 10.0,
            status: "ACTIVE",
          },
          "usr-admin-01": {
            userId: "usr-admin-01",
            userFullName: "Provost Elena Evans",
            userRole: "SUPER_ADMIN",
            rfidCardId: "RFID-APEX-100001",
            currentBalance: 125.0,
            dailySpendingLimit: 100.0,
            autoRechargeThreshold: 20.0,
            status: "ACTIVE",
          },
        },
        orders: [
          {
            orderId: "ord-101",
            orderToken: "#CAN-101",
            userId: "usr-stu-01",
            customerName: "Alex Mercer",
            items: [
              {
                menuItemId: "dish-01",
                name: "Crisp Masala Dosa & Coconut Chutney",
                quantity: 1,
                unitPrice: 4.5,
                subtotal: 4.5,
                calories: 380,
              },
              {
                menuItemId: "dish-07",
                name: "Artisanal Cold Brew / Iced Latte",
                quantity: 1,
                unitPrice: 3.5,
                subtotal: 3.5,
                calories: 110,
              },
            ],
            subtotalAmount: 8.0,
            discountApplied: 0.8,
            totalAmount: 7.2,
            paymentMethod: "MEAL_WALLET",
            status: "READY_FOR_PICKUP",
            counterNo: 2,
            placedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
        ],
        transactions: [
          {
            id: "tx-init-01",
            userId: "usr-stu-01",
            type: "CREDIT_TOPUP",
            amount: 50.0,
            balanceAfter: 50.0,
            reference: "TOPUP-UPI-99214A",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "tx-init-02",
            userId: "usr-stu-01",
            type: "DEBIT_PURCHASE",
            amount: 7.2,
            balanceAfter: 42.8,
            reference: "ORD-#CAN-101",
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
        ],
        orderCounter: 102,
      };
      this.saveData(initial);
      return initial;
    }

    try {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      return JSON.parse(raw);
    } catch {
      return {
        menu: DEFAULT_MENU,
        wallets: {},
        orders: [],
        transactions: [],
        orderCounter: 100,
      };
    }
  }

  private saveData(data: CanteenStoreSchema) {
    ensureDirectory();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  public getMenu(): CanteenMenuItem[] {
    return this.data.menu;
  }

  public getWallet(userId: string, fullName: string = "Campus Scholar", role: string = "STUDENT"): MealWalletAccount {
    if (!this.data.wallets[userId]) {
      this.data.wallets[userId] = {
        userId,
        userFullName: fullName,
        userRole: role,
        rfidCardId: `RFID-APEX-${Math.floor(100000 + Math.random() * 900000)}`,
        currentBalance: 35.0,
        dailySpendingLimit: 30.0,
        autoRechargeThreshold: 10.0,
        status: "ACTIVE",
      };
      this.saveData(this.data);
    }
    return this.data.wallets[userId];
  }

  public topUpWallet(userId: string, amount: number, reference: string = "UPI-TOPUP"): MealWalletAccount {
    const wallet = this.getWallet(userId);
    wallet.currentBalance = Math.round((wallet.currentBalance + amount) * 100) / 100;

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      userId,
      type: "CREDIT_TOPUP",
      amount,
      balanceAfter: wallet.currentBalance,
      reference,
      timestamp: new Date().toISOString(),
    };

    this.data.transactions.unshift(tx);
    this.saveData(this.data);
    return wallet;
  }

  public placeOrder(
    userId: string,
    customerName: string,
    userRole: string,
    itemsToOrder: { itemId: string; quantity: number }[],
    paymentMethod: "MEAL_WALLET" | "CAMPUS_UPI" | "CASH_COUNTER"
  ): { success: boolean; order?: CanteenOrder; error?: string } {
    if (!itemsToOrder || itemsToOrder.length === 0) {
      return { success: false, error: "Cannot place empty cafeteria order" };
    }

    const resolvedItems: { menuItem: CanteenMenuItem; quantity: number }[] = [];
    for (const item of itemsToOrder) {
      const targetId = (item as any).itemId || (item as any).menuItemId || (item as any).id;
      const found = this.data.menu.find((m) => m.id === targetId);
      if (!found) {
        return { success: false, error: `Menu item with id ${targetId} not found` };
      }
      if (found.availableStock < item.quantity) {
        return { success: false, error: `Insufficient stock for ${found.name}` };
      }
      resolvedItems.push({ menuItem: found, quantity: item.quantity });
    }

    const { subtotal, discount, finalTotal } = calculateOrderTotal(resolvedItems, userRole);

    // If paying via wallet, validate balance
    const wallet = this.getWallet(userId, customerName, userRole);
    if (paymentMethod === "MEAL_WALLET") {
      const validation = validateWalletBalance(wallet, finalTotal);
      if (!validation.canAfford) {
        return { success: false, error: validation.reason || "Insufficient wallet funds" };
      }

      wallet.currentBalance = validation.remainingBalance;
      this.data.transactions.unshift({
        id: `tx-${Date.now()}`,
        userId,
        type: "DEBIT_PURCHASE",
        amount: finalTotal,
        balanceAfter: wallet.currentBalance,
        reference: `ORD-#CAN-${this.data.orderCounter}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Deduct stock
    for (const item of resolvedItems) {
      item.menuItem.availableStock -= item.quantity;
    }

    const token = generateOrderToken(this.data.orderCounter);
    this.data.orderCounter++;

    const order: CanteenOrder = {
      orderId: `ord-${Date.now()}`,
      orderToken: token,
      userId,
      customerName,
      items: resolvedItems.map((i) => ({
        menuItemId: i.menuItem.id,
        name: i.menuItem.name,
        quantity: i.quantity,
        unitPrice: i.menuItem.price,
        subtotal: Math.round(i.menuItem.price * i.quantity * 100) / 100,
        calories: i.menuItem.calories * i.quantity,
      })),
      subtotalAmount: subtotal,
      discountApplied: discount,
      totalAmount: finalTotal,
      paymentMethod,
      status: "PREPARING",
      counterNo: (this.data.orderCounter % 3) + 1, // Counters 1, 2, or 3
      placedAt: new Date().toISOString(),
    };

    this.data.orders.unshift(order);
    this.saveData(this.data);
    return { success: true, order };
  }

  public updateOrderStatus(orderId: string, status: "PREPARING" | "READY_FOR_PICKUP" | "COLLECTED"): CanteenOrder | null {
    const order = this.data.orders.find((o) => o.orderId === orderId);
    if (!order) return null;
    order.status = status;
    this.saveData(this.data);
    return order;
  }

  public getOrders(userId?: string): CanteenOrder[] {
    if (userId) {
      return this.data.orders.filter((o) => o.userId === userId);
    }
    return this.data.orders;
  }

  public getTransactions(userId: string): WalletTransaction[] {
    return this.data.transactions.filter((t) => t.userId === userId);
  }
}

export const canteenStore = new CanteenStore();
