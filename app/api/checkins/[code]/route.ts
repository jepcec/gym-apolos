import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const client = await prisma.client.findUnique({
      where: { code },
      include: {
        memberships: {
          where: { status: "active" },
          include: { type: true },
          orderBy: { endDate: "desc" },
          take: 1,
        },
        checkins: {
          orderBy: { checkinDate: "desc" },
          take: 10,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching checkin info:", error);
    return NextResponse.json(
      { error: "Error fetching client info" },
      { status: 500 }
    );
  }
}
