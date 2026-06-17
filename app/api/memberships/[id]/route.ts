import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, price } = body;

    const membership = await prisma.membership.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(status !== undefined && { status }),
        ...(price !== undefined && { price }),
      },
      include: {
        client: true,
        type: true,
      },
    });

    return NextResponse.json(membership);
  } catch (error) {
    console.error("Error updating membership:", error);
    return NextResponse.json(
      { error: "Error updating membership" },
      { status: 500 }
    );
  }
}
