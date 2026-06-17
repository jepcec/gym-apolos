import { NextRequest, NextResponse } from "next/server";
import prisma from "../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");

    const where = clientId ? { clientId: parseInt(clientId, 10) } : {};

    const checkins = await prisma.checkin.findMany({
      where,
      include: {
        client: true,
      },
      orderBy: { checkinDate: "desc" },
      take: 100,
    });

    return NextResponse.json(checkins);
  } catch (error) {
    console.error("Error fetching checkins:", error);
    return NextResponse.json(
      { error: "Error fetching checkins" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, checkinDate } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    const checkDate = checkinDate ? new Date(checkinDate) : new Date();
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingCheckin = await prisma.checkin.findFirst({
      where: {
        clientId,
        checkinDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingCheckin) {
      return NextResponse.json(
        { error: "Check-in already exists for today" },
        { status: 409 }
      );
    }

    const checkin = await prisma.checkin.create({
      data: {
        clientId,
        checkinDate: checkDate,
      },
      include: {
        client: true,
      },
    });

    await prisma.client.update({
      where: { id: clientId },
      data: { lastCheckin: checkDate },
    });

    return NextResponse.json(checkin, { status: 201 });
  } catch (error) {
    console.error("Error creating checkin:", error);
    return NextResponse.json(
      { error: "Error creating checkin" },
      { status: 500 }
    );
  }
}
