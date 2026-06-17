import { NextRequest, NextResponse } from "next/server";
import prisma from "../../lib/prisma";

async function generateClientCode(): Promise<string> {
  const clients = await prisma.client.findMany({
    select: { code: true },
    orderBy: { createdAt: "desc" },
  });

  if (clients.length === 0) {
    return "APG0001";
  }

  const maxCode = clients
    .map((c) => {
      const match = c.code.match(/^APG(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .reduce((max, num) => Math.max(max, num), 0);

  return `APG${String(maxCode + 1).padStart(4, "0")}`;
}

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
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const code = await generateClientCode();

    const client = await prisma.client.create({
      data: {
        code,
        name: name.trim(),
        dni: dni || null,
        phone: phone || null,
        email: email || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        address: address || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Error creating client" },
      { status: 500 }
    );
  }
}
