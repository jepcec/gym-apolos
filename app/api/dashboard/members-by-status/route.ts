import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const warningDays = parseInt(
      settings.find((s) => s.key === "warning_days")?.value || "7",
      10
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + warningDays);
    warningDate.setHours(23, 59, 59, 999);

    const clients = await prisma.client.findMany({
      where: { status: "active" },
      include: {
        memberships: {
          include: { type: true },
          orderBy: { endDate: "desc" },
        },
      },
    });

    const buckets = {
      expiring_soon: [] as typeof clients,
      expired: [] as typeof clients,
      active: [] as typeof clients,
      no_membership: [] as typeof clients,
    };

    for (const client of clients) {
      const activeMembership = client.memberships.find((m) => m.status === "active");
      const expiredMembership = client.memberships.find((m) => m.status === "expired");

      if (activeMembership) {
        if (activeMembership.endDate < today) {
          buckets.expired.push(client);
        } else if (activeMembership.endDate <= warningDate) {
          buckets.expiring_soon.push(client);
        } else {
          buckets.active.push(client);
        }
      } else if (expiredMembership) {
        buckets.expired.push(client);
      } else {
        buckets.no_membership.push(client);
      }
    }

    return NextResponse.json(buckets);
  } catch (error) {
    console.error("Error fetching members by status:", error);
    return NextResponse.json(
      { error: "Error fetching members by status" },
      { status: 500 }
    );
  }
}
