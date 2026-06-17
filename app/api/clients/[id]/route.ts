import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        memberships: {
          include: { type: true },
          orderBy: { createdAt: "desc" },
        },
        checkins: {
          orderBy: { checkinDate: "desc" },
          take: 100,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Error fetching client" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, dni, phone, email, birthDate, address, status } = body;

    const client = await prisma.client.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(name !== undefined && { name }),
        ...(dni !== undefined && { dni }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
        ...(address !== undefined && { address }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Error updating client" },
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
    await prisma.client.delete({
      where: { id: parseInt(id, 10) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Error deleting client" },
      { status: 500 }
    );
  }
}
