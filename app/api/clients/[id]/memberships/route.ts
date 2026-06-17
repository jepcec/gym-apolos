import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memberships = await prisma.membership.findMany({
      where: { clientId: parseInt(id, 10) },
      include: { type: true, client: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(memberships);
  } catch (error) {
    console.error("Error fetching client memberships:", error);
    return NextResponse.json(
      { error: "Error fetching memberships" },
      { status: 500 }
    );
  }
}
