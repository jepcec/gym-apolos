import { NextRequest, NextResponse } from "next/server";
import prisma from "../../lib/prisma";

export async function GET() {
  try {
    const types = await prisma.membershipType.findMany({
      orderBy: { durationDays: "asc" },
    });
    return NextResponse.json(types);
  } catch (error) {
    console.error("Error fetching membership types:", error);
    return NextResponse.json(
      { error: "Error fetching membership types" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, durationDays, price, description } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const type = await prisma.membershipType.create({
      data: {
        name: name.trim(),
        durationDays: durationDays || 30,
        price: price || 0,
        description: description || null,
      },
    });

    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    console.error("Error creating membership type:", error);
    return NextResponse.json(
      { error: "Error creating membership type" },
      { status: 500 }
    );
  }
}
