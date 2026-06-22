import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: sixMonthsAgo,
          lte: endOfMonth,
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const monthlyData: Record<string, { month: string; year: number; total: number; count: number }> = {};

    for (const payment of payments) {
      const date = new Date(payment.paymentDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: monthNames[date.getMonth()],
          year: date.getFullYear(),
          total: 0,
          count: 0,
        };
      }
      
      monthlyData[key].total += payment.amount;
      monthlyData[key].count += 1;
    }

    const result = Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return monthNames.indexOf(b.month) - monthNames.indexOf(a.month);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching monthly income:", error);
    return NextResponse.json(
      { error: "Error fetching monthly income" },
      { status: 500 }
    );
  }
}
