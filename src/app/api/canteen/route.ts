import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { canteenStore } from "@/lib/canteen/canteen-store";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    const userId = session?.userId || "usr-stu-01";
    const userName = session?.email?.split("@")[0] || "Alex Mercer";
    const userRole = session?.role || "STUDENT";

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";

    if (tab === "menu") {
      const menu = canteenStore.getMenu();
      return NextResponse.json({ success: true, menu });
    }

    if (tab === "wallet") {
      const wallet = canteenStore.getWallet(userId, userName, userRole);
      const transactions = canteenStore.getTransactions(userId);
      return NextResponse.json({ success: true, wallet, transactions });
    }

    if (tab === "orders") {
      const isStaff = userRole === "SUPER_ADMIN" || userRole === "INSTITUTION_ADMIN" || userRole === "HR_STAFF";
      const orders = canteenStore.getOrders(isStaff ? undefined : userId);
      return NextResponse.json({ success: true, orders });
    }

    // Default: summary
    const menu = canteenStore.getMenu();
    const wallet = canteenStore.getWallet(userId, userName, userRole);
    const orders = canteenStore.getOrders(userId);

    const activePreparingCount = orders.filter((o) => o.status === "PREPARING").length;
    const readyPickupCount = orders.filter((o) => o.status === "READY_FOR_PICKUP").length;

    return NextResponse.json({
      success: true,
      summary: {
        totalDishes: menu.length,
        walletBalance: wallet.currentBalance,
        rfidCardId: wallet.rfidCardId,
        activeOrdersCount: activePreparingCount + readyPickupCount,
        readyPickupCount,
      },
      menu,
      wallet,
      orders,
    });
  } catch (error: any) {
    console.error("[Canteen API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve cafeteria data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    const userId = session?.userId || "usr-stu-01";
    const userName = session?.email?.split("@")[0] || "Alex Mercer";
    const userRole = session?.role || "STUDENT";

    const body = await request.json();
    const { action } = body;

    if (action === "TOP_UP_WALLET") {
      const { amount, reference } = body;
      const topUpAmount = Number(amount);
      if (isNaN(topUpAmount) || topUpAmount <= 0) {
        return NextResponse.json({ error: "Invalid top-up amount" }, { status: 400 });
      }

      const updatedWallet = canteenStore.topUpWallet(userId, topUpAmount, reference || "UPI-WALLET-TOPUP");
      return NextResponse.json({
        success: true,
        message: `Successfully added $${topUpAmount.toFixed(2)} to RFID Smart Card!`,
        wallet: updatedWallet,
      });
    }

    if (action === "PLACE_ORDER") {
      const { items, paymentMethod } = body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "Please select at least one meal item" }, { status: 400 });
      }

      const result = canteenStore.placeOrder(
        userId,
        userName,
        userRole,
        items,
        paymentMethod || "MEAL_WALLET"
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Order placement failed" }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `Order confirmed! Collect with token ${result.order?.orderToken} at Counter ${result.order?.counterNo}`,
        order: result.order,
      });
    }

    if (action === "UPDATE_ORDER_STATUS") {
      const { orderId, status } = body;
      if (!orderId || !status) {
        return NextResponse.json({ error: "Order ID and target status required" }, { status: 400 });
      }

      const updated = canteenStore.updateOrderStatus(orderId, status);
      if (!updated) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Order token ${updated.orderToken} transitioned to ${status}`,
        order: updated,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Canteen API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process canteen request" }, { status: 400 });
  }
}
