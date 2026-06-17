import { NextRequest, NextResponse } from "next/server";
import prisma from "../../lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const activeClients = await prisma.client.count({
      where: { status: "active" },
    });

    const settings = await prisma.setting.findMany();
    const warningDays = parseInt(
      settings.find((s) => s.key === "warning_days")?.value || "7",
      10
    );

    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + warningDays);

    const expiringMemberships = await prisma.membership.count({
      where: {
        status: "active",
        endDate: {
          gte: new Date(),
          lte: warningDate,
        },
      },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayCheckins = await prisma.checkin.count({
      where: {
        checkinDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const monthlyPayments = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });

    const monthlyIncome = monthlyPayments._sum.amount || 0;

    const newClientsThisMonth = await prisma.client.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    return NextResponse.json({
      activeClients,
      expiringMemberships,
      todayCheckins,
      monthlyIncome,
      newClientsThisMonth,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Error fetching dashboard stats" },
      { status: 500 }
    );
  }
}
