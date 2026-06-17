import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, durationDays, price, description } = body;

    const type = await prisma.membershipType.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(name !== undefined && { name }),
        ...(durationDays !== undefined && { durationDays }),
        ...(price !== undefined && { price }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(type);
  } catch (error) {
    console.error("Error updating membership type:", error);
    return NextResponse.json(
      { error: "Error updating membership type" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.membershipType.delete({
      where: { id: parseInt(id, 10) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting membership type:", error);
    return NextResponse.json(
      { error: "Error deleting membership type" },
      { status: 500 }
    );
  }
}
