import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface ClientCSV {
  code: string;
  name: string;
  dni: string | null;
  phone: string | null;
  email: string | null;
  birthDate: string | Date | null;
  address: string | null;
  status: string;
  lastCheckin: string | Date | null;
  createdAt: string | Date;
}

interface MembershipCSV {
  client: { code: string; name: string };
  type: { name: string } | null;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  price: number;
}

interface CheckinCSV {
  client: { code: string; name: string };
  checkinDate: string | Date;
}

interface PaymentCSV {
  membership: {
    client: { name: string } | null;
    type: { name: string } | null;
  } | null;
  amount: number;
  paymentMethod: string | null;
  paymentDate: string | Date;
  note: string | null;
}

function clientsToCSV(clients: ClientCSV[]): string {
  const headers = ["Code", "Name", "DNI", "Phone", "Email", "Birth Date", "Address", "Status", "Last Check-in", "Created At"];
  const rows = clients.map((c) => [
    escapeCSV(c.code),
    escapeCSV(c.name),
    escapeCSV(c.dni),
    escapeCSV(c.phone),
    escapeCSV(c.email),
    escapeCSV(c.birthDate ? new Date(c.birthDate).toISOString().split("T")[0] : ""),
    escapeCSV(c.address),
    escapeCSV(c.status),
    escapeCSV(c.lastCheckin ? new Date(c.lastCheckin).toISOString().split("T")[0] : ""),
    escapeCSV(new Date(c.createdAt).toISOString().split("T")[0]),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function membershipsToCSV(memberships: MembershipCSV[]): string {
  const headers = ["Client Code", "Client Name", "Plan", "Start Date", "End Date", "Status", "Price"];
  const rows = memberships.map((m) => [
    escapeCSV(m.client.code),
    escapeCSV(m.client.name),
    escapeCSV(m.type?.name || "Custom"),
    escapeCSV(new Date(m.startDate).toISOString().split("T")[0]),
    escapeCSV(new Date(m.endDate).toISOString().split("T")[0]),
    escapeCSV(m.status),
    escapeCSV(m.price),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function checkinsToCSV(checkins: CheckinCSV[], month?: string): string {
  const headers = ["Client Code", "Client Name", "Date"];
  let filtered = checkins;

  if (month) {
    const [year, m] = month.split("-");
    filtered = checkins.filter((c) => {
      const d = new Date(c.checkinDate);
      return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(m);
    });
  }

  const rows = filtered.map((c) => [
    escapeCSV(c.client.code),
    escapeCSV(c.client.name),
    escapeCSV(new Date(c.checkinDate).toISOString().split("T")[0]),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function paymentsToCSV(payments: PaymentCSV[], month?: string): string {
  const headers = ["Client", "Plan", "Amount", "Method", "Date", "Note"];
  let filtered = payments;

  if (month) {
    const [year, m] = month.split("-");
    filtered = payments.filter((p) => {
      const d = new Date(p.paymentDate);
      return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(m);
    });
  }

  const rows = filtered.map((p) => [
    escapeCSV(p.membership?.client?.name || ""),
    escapeCSV(p.membership?.type?.name || ""),
    escapeCSV(p.amount),
    escapeCSV(p.paymentMethod || ""),
    escapeCSV(new Date(p.paymentDate).toISOString().split("T")[0]),
    escapeCSV(p.note || ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || undefined;

    const now = new Date();
    const filenameDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    switch (type) {
      case "clients": {
        const clients = await prisma.client.findMany({
          orderBy: { createdAt: "desc" },
        });
        const csv = clientsToCSV(clients);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="clients-${filenameDate}.csv"`,
          },
        });
      }

      case "memberships": {
        const memberships = await prisma.membership.findMany({
          include: { client: true, type: true },
          orderBy: { createdAt: "desc" },
        });
        const csv = membershipsToCSV(memberships);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="memberships-${filenameDate}.csv"`,
          },
        });
      }

      case "checkins": {
        const checkins = await prisma.checkin.findMany({
          include: { client: true },
          orderBy: { checkinDate: "desc" },
          take: 1000,
        });
        const csv = checkinsToCSV(checkins, month);
        const filenameMonth = month || filenameDate;
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="checkins-${filenameMonth}.csv"`,
          },
        });
      }

      case "payments": {
        const payments = await prisma.payment.findMany({
          include: { membership: { include: { client: true, type: true } } },
          orderBy: { paymentDate: "desc" },
          take: 1000,
        });
        const csv = paymentsToCSV(payments, month);
        const filenameMonth = month || filenameDate;
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="payments-${filenameMonth}.csv"`,
          },
        });
      }

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Error generating report" },
      { status: 500 }
    );
  }
}
