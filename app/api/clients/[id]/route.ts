import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { normalizeDni, validateDni } from "../../../lib/dni";

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

    let dniClean: string | undefined;
    if (dni !== undefined) {
      const dniError = validateDni(dni);
      if (dniError) {
        return NextResponse.json({ error: dniError }, { status: 400 });
      }
      dniClean = normalizeDni(dni);
      const conflicto = await prisma.client.findFirst({
        where: { dni: dniClean, NOT: { id: parseInt(id, 10) } },
      });
      if (conflicto) {
        return NextResponse.json(
          { error: `El DNI ${dniClean} ya está registrado a nombre de ${conflicto.name}` },
          { status: 409 }
        );
      }
    }

    const client = await prisma.client.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(name !== undefined && { name }),
        ...(dniClean !== undefined && { dni: dniClean }),
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
