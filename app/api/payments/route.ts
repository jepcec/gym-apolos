import { NextRequest, NextResponse } from "next/server";
import prisma from "../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get("membership_id");

    const where = membershipId
      ? { membershipId: parseInt(membershipId, 10) }
      : {};

    const payments = await prisma.payment.findMany({
      where,
      include: {
        membership: {
          include: {
            client: true,
            type: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Error fetching payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { membershipId, amount, paymentMethod, paymentDate, note } = body;

    if (!membershipId) {
      return NextResponse.json(
        { error: "Membership ID is required" },
        { status: 400 }
      );
    }

    if (amount === undefined || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        membershipId,
        amount,
        paymentMethod: paymentMethod || null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        note: note || null,
      },
      include: {
        membership: {
          include: {
            client: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Error creating payment" },
      { status: 500 }
    );
  }
}
