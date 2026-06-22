import { NextRequest, NextResponse } from "next/server";
import prisma from "../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");

    const where = clientId ? { clientId: parseInt(clientId, 10) } : {};

    const memberships = await prisma.membership.findMany({
      where,
      include: {
        client: true,
        type: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(memberships);
  } catch (error) {
    console.error("Error fetching memberships:", error);
    return NextResponse.json(
      { error: "Error fetching memberships" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, typeId, startDate, durationDays, price } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    let endDate: Date;
    let finalTypeId: number | null;

    if (typeId && typeId > 0) {
      const membershipType = await prisma.membershipType.findUnique({
        where: { id: typeId },
      });

      if (!membershipType) {
        return NextResponse.json(
          { error: "Membership type not found" },
          { status: 400 }
        );
      }

      finalTypeId = typeId;
      const start = startDate ? new Date(startDate) : new Date();
      endDate = new Date(start);
      endDate.setDate(endDate.getDate() + membershipType.durationDays);
    } else if (durationDays && durationDays > 0) {
      finalTypeId = null;
      const start = startDate ? new Date(startDate) : new Date();
      endDate = new Date(start);
      endDate.setDate(endDate.getDate() + durationDays);
    } else {
      return NextResponse.json(
        { error: "Either typeId or durationDays must be provided" },
        { status: 400 }
      );
    }

    const membership = await prisma.membership.create({
      data: {
        clientId,
        typeId: finalTypeId,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate,
        status: "active",
        price: price || 0,
      },
      include: {
        client: true,
        type: true,
      },
    });

    await prisma.payment.create({
      data: {
        membershipId: membership.id,
        amount: price || 0,
        paymentDate: startDate ? new Date(startDate) : new Date(),
      },
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error("Error creating membership:", error);
    return NextResponse.json(
      { error: "Error creating membership" },
      { status: 500 }
    );
  }
}
