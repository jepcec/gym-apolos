import { NextRequest, NextResponse } from "next/server";
import prisma from "../../lib/prisma";
import { normalizeDni, validateDni } from "../../lib/dni";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        memberships: {
          include: { type: true },
          orderBy: { endDate: "desc" },
        },
        checkins: {
          orderBy: { checkinDate: "desc" },
          take: 100,
        },
      },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Error fetching clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, dni, phone, email, birthDate, address } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const dniError = validateDni(dni);
    if (dniError) {
      return NextResponse.json({ error: dniError }, { status: 400 });
    }
    const dniClean = normalizeDni(dni);

    const existing = await prisma.client.findUnique({ where: { dni: dniClean } });
    if (existing) {
      return NextResponse.json(
        { error: `El DNI ${dniClean} ya está registrado a nombre de ${existing.name}` },
        { status: 409 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        dni: dniClean,
        phone: phone || null,
        email: email || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        address: address || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Error creating client" }, { status: 500 });
  }
}
