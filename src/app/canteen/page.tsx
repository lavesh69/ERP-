"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import {
  UtensilsCrossed,
  CreditCard,
  PlusCircle,
  MinusCircle,
  Coffee,
  ShoppingBag,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Leaf,
  Filter,
  DollarSign,
  QrCode,
  ShieldCheck,
  Receipt,
  X,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  CanteenMenuItem,
  MealWalletAccount,
  CanteenOrder,
  MenuCategory,
  WalletTransaction,
} from "@/lib/canteen/canteen-engine";

export default function CanteenPage() {
  const { showToast, currentUser, currentRole } = useApp();
  const [activeTab, setActiveTab] = useState<"menu" | "orders" | "wallet">("menu");
  const [loading, setLoading] = useState(true);

  // Data states
  const [menu, setMenu] = useState<CanteenMenuItem[]>([]);
  const [wallet, setWallet] = useState<MealWalletAccount | null>(null);
  const [orders, setOrders] = useState<CanteenOrder[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Cart / Tray state
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isOrdering, setIsOrdering] = useState(false);

  // Top Up Modal State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(25);
  const [isToppingUp, setIsToppingUp] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/canteen");
      const data = await res.json();
      if (res.ok && data.success) {
        setMenu(data.menu || []);
        setWallet(data.wallet || null);
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Failed to load canteen data:", err);
      showToast("Error retrieving cafeteria data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddToCart = (itemId: string) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[itemId] > 1) {
        next[itemId] -= 1;
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  // Cart calculations
  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const item = menu.find((m) => m.id === id);
    return {
      item,
      quantity: qty,
      subtotal: (item?.price || 0) * qty,
    };
  }).filter((c) => c.item !== undefined);

  const totalRawAmount = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const studentDiscount = Math.round(totalRawAmount * 0.1 * 100) / 100; // 10% student subsidy
  const netAmount = Math.max(0, Math.round((totalRawAmount - studentDiscount) * 100) / 100);
  const totalCalories = cartItems.reduce((acc, curr) => acc + (curr.item?.calories || 0) * curr.quantity, 0);

  const handlePlaceOrder = async (method: "MEAL_WALLET" | "CAMPUS_UPI" | "CASH_COUNTER") => {
    if (cartItems.length === 0) return;
    setIsOrdering(true);

    try {
      const payload = {
        action: "PLACE_ORDER",
        items: cartItems.map((c) => ({ itemId: c.item!.id, quantity: c.quantity })),
        paymentMethod: method,
      };

      const res = await fetch("/api/canteen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Order failed");
      }

      showToast(data.message, "success");
      setCart({});
      fetchData();
      setActiveTab("orders");
    } catch (err: any) {
      showToast(err.message || "Failed to place order", "error");
    } finally {
      setIsOrdering(false);
    }
  };

  const handleTopUpWallet = async () => {
    if (!topUpAmount || topUpAmount <= 0) return;
    setIsToppingUp(true);

    try {
      const res = await fetch("/api/canteen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOP_UP_WALLET",
          amount: topUpAmount,
          reference: `UPI-RECHARGE-${Date.now().toString().slice(-6)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Recharge failed");
      }

      showToast(data.message, "success");
      setShowTopUpModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to top up wallet", "error");
    } finally {
      setIsToppingUp(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: "READY_FOR_PICKUP" | "COLLECTED") => {
    try {
      const res = await fetch("/api/canteen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_ORDER_STATUS", orderId, status }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "info");
        fetchData();
      }
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  // Filter menu
  const filteredMenu = menu.filter((item) => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    if (vegOnly && !item.isVeg) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Top Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-charcoal-900 via-amber-950 to-charcoal-900 text-white p-6 md:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                <UtensilsCrossed className="w-3.5 h-3.5" /> Apex Central Cafeteria & Food Court
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-white">
                Campus Smart-Card Meal POS
              </h1>
              <p className="text-xs md:text-sm text-charcoal-300 max-w-xl mt-1">
                Cashless RFID contactless food ordering, daily chef specials, live pickup token board, and nutritional calorie tracking.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {wallet && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-charcoal-950 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-200 block">Meal RFID Balance</span>
                    <span className="text-lg font-mono font-black text-white">${wallet.currentBalance.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => setShowTopUpModal(true)}
                    className="ml-2 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-charcoal-950 font-bold text-xs shadow-sm transition-all active:scale-95"
                  >
                    + Top Up
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-amber-900/40 text-xs">
            <div>
              <span className="text-amber-200/70 uppercase text-[10px] font-bold block">Daily Menu Offerings</span>
              <span className="text-xl font-bold font-display text-white mt-0.5 block">{menu.length} Artisan Dishes</span>
            </div>
            <div>
              <span className="text-amber-200/70 uppercase text-[10px] font-bold block">Contactless Card ID</span>
              <span className="text-xl font-mono font-bold text-amber-300 mt-0.5 block">{wallet?.rfidCardId || "RFID-SYNC"}</span>
            </div>
            <div>
              <span className="text-amber-200/70 uppercase text-[10px] font-bold block">Active Orders in Kitchen</span>
              <span className="text-xl font-bold font-display text-emerald-300 mt-0.5 block">
                {orders.filter((o) => o.status === "PREPARING").length} Cooking Now
              </span>
            </div>
            <div>
              <span className="text-amber-200/70 uppercase text-[10px] font-bold block">Ready at Counter</span>
              <span className="text-xl font-bold font-display text-cyan-300 mt-0.5 block">
                {orders.filter((o) => o.status === "READY_FOR_PICKUP").length} Awaiting Collection
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border dark:border-charcoal-700 pb-2 overflow-x-auto">
          {[
            { id: "menu", label: "Live Menu & Order POS", icon: UtensilsCrossed },
            { id: "orders", label: "Order Tokens & Pickup Board", icon: Receipt },
            { id: "wallet", label: "Smart Meal Wallet & Pass", icon: CreditCard },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-amber-500 text-charcoal-950 shadow-sm"
                    : "bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-surface-soft border border-border dark:border-charcoal-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Menu & POS Ordering */}
        {activeTab === "menu" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Menu Selection */}
            <div className="lg:col-span-2 space-y-5">
              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {["ALL", "BREAKFAST", "LUNCH_SPECIAL", "HEALTHY_BOWLS", "SNACKS", "BEVERAGES"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        selectedCategory === cat
                          ? "bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-900"
                          : "bg-surface-soft dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 hover:bg-border"
                      }`}
                    >
                      {cat.replace("_", " ")}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVegOnly(!vegOnly)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      vegOnly
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700"
                        : "border-border text-charcoal-500 hover:bg-surface-soft"
                    }`}
                  >
                    <Leaf className="w-3.5 h-3.5 text-emerald-500" /> Veg Only
                  </button>
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMenu.map((dish) => {
                  const inCartCount = cart[dish.id] || 0;
                  return (
                    <div
                      key={dish.id}
                      className="p-5 rounded-2xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                dish.isVeg ? "border-emerald-600" : "border-rose-600"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  dish.isVeg ? "bg-emerald-600" : "bg-rose-600"
                                }`}
                              />
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
                              {dish.category.replace("_", " ")}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Flame className="w-3 h-3" /> {dish.calories} kcal
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mb-1">
                          {dish.name}
                        </h3>
                        <p className="text-[11px] text-charcoal-500 leading-relaxed mb-4">
                          {dish.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border/60 dark:border-charcoal-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-base font-mono font-black text-charcoal-900 dark:text-white">
                            ${dish.price.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-charcoal-400 block">Est: {dish.prepTimeMins} mins</span>
                        </div>

                        {inCartCount === 0 ? (
                          <button
                            onClick={() => handleAddToCart(dish.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-charcoal-950 font-bold text-xs shadow-sm transition-all active:scale-95"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Add to Tray
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-950/60 px-2 py-1 rounded-xl border border-amber-300 dark:border-amber-700">
                            <button
                              onClick={() => handleRemoveFromCart(dish.id)}
                              className="text-amber-900 dark:text-amber-200 hover:text-amber-700 p-0.5"
                            >
                              <MinusCircle className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-mono font-bold text-amber-950 dark:text-amber-100 px-1">
                              {inCartCount}
                            </span>
                            <button
                              onClick={() => handleAddToCart(dish.id)}
                              className="text-amber-900 dark:text-amber-200 hover:text-amber-700 p-0.5"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Live Order Tray / Cart */}
            <div className="space-y-4">
              <div className="sticky top-20 rounded-3xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 p-6 shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-border dark:border-charcoal-700">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-500" />
                    <h2 className="text-base font-display font-bold text-charcoal-900 dark:text-white">
                      Order Tray ({cartItems.reduce((acc, c) => acc + c.quantity, 0)})
                    </h2>
                  </div>
                  {cartItems.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-xs text-rose-500 hover:underline font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {cartItems.length === 0 ? (
                  <div className="py-12 text-center text-charcoal-400 text-xs">
                    <UtensilsCrossed className="w-10 h-10 mx-auto text-charcoal-300 mb-2 opacity-50" />
                    Your tray is empty. Add dishes from the menu to start order.
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    <div className="divide-y divide-border/60 dark:divide-charcoal-700/60 max-h-64 overflow-y-auto pr-1">
                      {cartItems.map(({ item, quantity, subtotal }) => (
                        <div key={item!.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                              {item!.name}
                            </span>
                            <span className="text-[10px] text-charcoal-400 font-mono">
                              ${item!.price.toFixed(2)} × {quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-charcoal-800 dark:text-ivory-200">
                              ${subtotal.toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleRemoveFromCart(item!.id)}
                              className="text-charcoal-400 hover:text-rose-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Breakdown */}
                    <div className="p-4 rounded-2xl bg-surface-soft dark:bg-charcoal-700/50 space-y-2 text-xs">
                      <div className="flex justify-between text-charcoal-500">
                        <span>Tray Subtotal</span>
                        <span className="font-mono font-semibold">${totalRawAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Campus Welfare Subsidy (10%)</span>
                        <span className="font-mono">-${studentDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600 font-semibold">
                        <span>Estimated Energy</span>
                        <span>{totalCalories} kcal</span>
                      </div>
                      <div className="pt-2 border-t border-border dark:border-charcoal-600 flex justify-between font-bold text-sm text-charcoal-900 dark:text-white">
                        <span>Net Payable</span>
                        <span className="font-mono text-base text-amber-500">${netAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Buttons */}
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => handlePlaceOrder("MEAL_WALLET")}
                        disabled={isOrdering || (wallet ? wallet.currentBalance < netAmount : true)}
                        className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-charcoal-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" /> Tap & Pay via Meal RFID Card (${wallet?.currentBalance.toFixed(2)})
                      </button>

                      <button
                        onClick={() => handlePlaceOrder("CAMPUS_UPI")}
                        disabled={isOrdering}
                        className="w-full py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:bg-surface-soft text-charcoal-800 dark:text-ivory-100 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-4 h-4 text-emerald-500" /> Pay via Campus UPI / QR Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Order Tokens & Pickup Board */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Live Token Pickup Display Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((counterNum) => {
                const counterOrders = orders.filter((o) => o.counterNo === counterNum && o.status !== "COLLECTED");
                return (
                  <div
                    key={counterNum}
                    className="p-5 rounded-2xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 shadow-sm"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-700 mb-3">
                      <span className="text-xs font-bold text-charcoal-900 dark:text-white">
                        Pickup Counter {counterNum}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {counterOrders.length} Active
                      </span>
                    </div>

                    <div className="space-y-2">
                      {counterOrders.length === 0 ? (
                        <p className="text-xs text-charcoal-400 italic py-4 text-center">No orders pending at this counter.</p>
                      ) : (
                        counterOrders.map((o) => (
                          <div
                            key={o.orderId}
                            className={`p-3 rounded-xl border flex items-center justify-between ${
                              o.status === "READY_FOR_PICKUP"
                                ? "bg-emerald-50/60 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700"
                                : "bg-surface-soft dark:bg-charcoal-700/40 border-border"
                            }`}
                          >
                            <div>
                              <div className="text-sm font-mono font-black text-charcoal-900 dark:text-white">
                                {o.orderToken}
                              </div>
                              <span className="text-[10px] text-charcoal-500 block">
                                {o.items.length} items • ${o.totalAmount.toFixed(2)}
                              </span>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                o.status === "READY_FOR_PICKUP"
                                  ? "bg-emerald-600 text-white animate-pulse"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                              }`}
                            >
                              {o.status === "READY_FOR_PICKUP" ? "READY FOR PICKUP" : "PREPARING"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Complete Order History Table */}
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft/40 flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-500" /> Recent Cafeteria Orders & Receipt Slips
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-soft/80 text-charcoal-500 uppercase text-[10px] font-bold border-b border-border">
                    <tr>
                      <th className="py-3 px-4">Order Token</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Dishes</th>
                      <th className="py-3 px-4">Counter</th>
                      <th className="py-3 px-4">Total Paid</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {orders.map((ord) => (
                      <tr key={ord.orderId} className="hover:bg-surface-soft/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                          {ord.orderToken}
                        </td>
                        <td className="py-3 px-4 font-bold text-charcoal-900 dark:text-white">
                          {ord.customerName}
                        </td>
                        <td className="py-3 px-4 text-charcoal-600 dark:text-charcoal-300">
                          {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                        </td>
                        <td className="py-3 px-4 font-bold">Counter {ord.counterNo}</td>
                        <td className="py-3 px-4 font-mono font-bold">${ord.totalAmount.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.status === "READY_FOR_PICKUP"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : ord.status === "COLLECTED"
                                ? "bg-charcoal-100 text-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {ord.status === "PREPARING" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.orderId, "READY_FOR_PICKUP")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700"
                            >
                              Mark Ready
                            </button>
                          )}
                          {ord.status === "READY_FOR_PICKUP" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.orderId, "COLLECTED")}
                              className="px-2.5 py-1 rounded-lg bg-charcoal-800 text-white font-bold text-[10px] hover:bg-charcoal-900"
                            >
                              Confirm Picked
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Smart Meal Wallet & Pass */}
        {activeTab === "wallet" && wallet && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Digital RFID Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-charcoal-950 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[220px]">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-950/70 block">
                    APEX UNIVERSITY DINING PASS
                  </span>
                  <span className="font-display font-black text-lg">Contactless RFID Wallet</span>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-charcoal-950/40 flex items-center justify-center font-bold">
                  ⚡
                </div>
              </div>

              <div className="py-4">
                <span className="text-[10px] uppercase font-bold text-amber-950/70 block">Stored Card Value</span>
                <span className="text-3xl font-mono font-black text-charcoal-950">
                  ${wallet.currentBalance.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-charcoal-950/20 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-amber-950/70 block">Cardholder</span>
                  <strong className="font-bold">{wallet.userFullName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-amber-950/70 block">RFID Token</span>
                  <span className="font-mono font-bold">{wallet.rfidCardId}</span>
                </div>
              </div>
            </div>

            {/* Wallet Limits & Actions */}
            <div className="p-6 rounded-3xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900 dark:text-white flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Wallet Controls & Contactless Security
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-charcoal-500">Contactless Card Status</span>
                    <span className="font-bold text-emerald-600">ACTIVE & AUTHORIZED</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-charcoal-500">Daily Contactless Spending Limit</span>
                    <span className="font-mono font-bold">${wallet.dailySpendingLimit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-charcoal-500">Auto Low-Balance Alert Floor</span>
                    <span className="font-mono font-bold">${wallet.autoRechargeThreshold.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-charcoal-950 font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  + Add Funds to RFID Dining Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Up Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-charcoal-900 rounded-3xl border border-border dark:border-charcoal-800 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-border dark:border-charcoal-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-charcoal-900 dark:text-white">
                    Top Up RFID Meal Card
                  </h3>
                </div>
                <button onClick={() => setShowTopUpModal(false)} className="text-charcoal-400 hover:text-charcoal-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-5 space-y-4">
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                  Select Quick Recharge Amount
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors ${
                        topUpAmount === amt
                          ? "bg-amber-400 border-amber-500 text-charcoal-950"
                          : "border-border hover:bg-surface-soft"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                    Or Enter Custom Amount ($)
                  </label>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-surface-soft"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTopUpWallet}
                  disabled={isToppingUp || topUpAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-charcoal-950 font-bold text-xs shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isToppingUp ? "Processing..." : `Confirm $${topUpAmount.toFixed(2)} Recharge`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
