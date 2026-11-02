import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

function dateFromToday(days: number, hour = 12): Date {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

async function createClient(data: {
  name: string;
  dni: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
}) {
  return prisma.client.create({
    data: {
      name: data.name,
      dni: data.dni,
      phone: data.phone,
      email: data.email,
      address: data.address,
      status: data.status ?? "active",
    },
  });
}

async function createMembership(data: {
  clientId: number;
  typeId?: number;
  startDate: Date;
  endDate: Date;
  status?: string;
  price: number;
}) {
  return prisma.membership.create({
    data: {
      clientId: data.clientId,
      typeId: data.typeId ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status ?? "active",
      price: data.price,
    },
  });
}

async function createCheckin(clientId: number, daysAgo: number, hour = 9) {
  const checkin = await prisma.checkin.create({
    data: {
      clientId,
      checkinDate: dateFromToday(-daysAgo, hour),
    },
  });

  await prisma.client.update({
    where: { id: clientId },
    data: { lastCheckin: checkin.checkinDate },
  });
}

async function createPayment(
  membershipId: number,
  amount: number,
  paymentMethod: string,
  daysAgo = 0
) {
  await prisma.payment.create({
    data: {
      membershipId,
      amount,
      paymentMethod,
      paymentDate: dateFromToday(-daysAgo, 10),
    },
  });
}

async function main() {
  console.log("Resetting database with deterministic test data...");

  await prisma.payment.deleteMany();
  await prisma.checkin.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.client.deleteMany();

  const types = await Promise.all([
    prisma.membershipType.upsert({
      where: { name: "Mensual" },
      update: { durationDays: 30, price: 50, description: "Membresía por un mes" },
      create: { name: "Mensual", durationDays: 30, price: 50, description: "Membresía por un mes" },
    }),
    prisma.membershipType.upsert({
      where: { name: "Trimestral" },
      update: { durationDays: 90, price: 135, description: "Membresía por tres meses" },
      create: { name: "Trimestral", durationDays: 90, price: 135, description: "Membresía por tres meses" },
    }),
    prisma.membershipType.upsert({
      where: { name: "Anual" },
      update: { durationDays: 365, price: 480, description: "Membresía por un año" },
      create: { name: "Anual", durationDays: 365, price: 480, description: "Membresía por un año" },
    }),
  ]);

  const [monthly, quarterly, annual] = types;

  const settings = [
    { key: "inactivity_days", value: "30" },
    { key: "warning_days", value: "7" },
    { key: "data_dir", value: "" },
    { key: "backup_dir", value: "" },
  ];
  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  // 1. Membresía activa, con pagos y varios check-ins.
  const active = await createClient({
    name: "Prueba Activa Completa",
    dni: "90000001",
    phone: "999000001",
    email: "activa@pruebas.local",
    address: "Av. Caso Activo 123",
  });
  const activeMembership = await createMembership({
    clientId: active.id,
    typeId: quarterly.id,
    startDate: dateFromToday(-30),
    endDate: dateFromToday(60),
    price: quarterly.price,
  });
  await createPayment(activeMembership.id, 135, "Efectivo", 30);
  await createPayment(activeMembership.id, 135, "Tarjeta", 5);
  await createCheckin(active.id, 7, 8);
  await createCheckin(active.id, 2, 18);
  await createCheckin(active.id, 0, 9);

  // 2. Membresía por vencer dentro del período de advertencia.
  const expiring = await createClient({
    name: "Prueba Por Vencer",
    dni: "90000002",
    phone: "999000002",
    email: "por.vencer@pruebas.local",
  });
  const expiringMembership = await createMembership({
    clientId: expiring.id,
    typeId: monthly.id,
    startDate: dateFromToday(-25),
    endDate: dateFromToday(5),
    price: monthly.price,
  });
  await createPayment(expiringMembership.id, 50, "Transferencia", 25);

  // 3. Membresía que vence exactamente hoy: debe permitir check-in durante el día.
  const expiresToday = await createClient({
    name: "Prueba Vence Hoy",
    dni: "90000003",
    email: "vence.hoy@pruebas.local",
  });
  await createMembership({
    clientId: expiresToday.id,
    typeId: monthly.id,
    startDate: dateFromToday(-30, 0),
    endDate: dateFromToday(0, 0),
    price: monthly.price,
  });

  // 4. Membresía vencida.
  const expired = await createClient({
    name: "Prueba Membresía Vencida",
    dni: "90000004",
    phone: "999000004",
    email: "vencida@pruebas.local",
  });
  const expiredMembership = await createMembership({
    clientId: expired.id,
    typeId: monthly.id,
    startDate: dateFromToday(-60),
    endDate: dateFromToday(-30),
    status: "expired",
    price: monthly.price,
  });
  await createPayment(expiredMembership.id, 50, "Efectivo", 45);
  await createCheckin(expired.id, 40, 11);

  // 5. Cliente sin membresía: el check-in debe ser rechazado por la API.
  await createClient({
    name: "Prueba Sin Membresía",
    dni: "90000005",
    phone: "999000005",
    email: "sin.membresia@pruebas.local",
  });

  // 6. Membresía con inicio futuro: tampoco debe permitir check-in.
  const future = await createClient({
    name: "Prueba Inicio Futuro",
    dni: "90000006",
    email: "futura@pruebas.local",
  });
  await createMembership({
    clientId: future.id,
    typeId: annual.id,
    startDate: dateFromToday(3),
    endDate: dateFromToday(368),
    price: annual.price,
  });

  // 7. Membresía personalizada sin tipo de plan.
  const custom = await createClient({
    name: "Prueba Duración Personalizada",
    dni: "90000007",
    address: "Jr. Personalizado 456",
  });
  const customMembership = await createMembership({
    clientId: custom.id,
    startDate: dateFromToday(-4),
    endDate: dateFromToday(10),
    price: 27.5,
  });
  await createPayment(customMembership.id, 27.5, "Yape");

  // 8. Cliente con varias membresías históricas y una vigente.
  const history = await createClient({
    name: "Prueba Historial Completo",
    dni: "90000008",
    phone: "999000008",
    email: "historial@pruebas.local",
  });
  const oldHistoryMembership = await createMembership({
    clientId: history.id,
    typeId: monthly.id,
    startDate: dateFromToday(-120),
    endDate: dateFromToday(-90),
    status: "expired",
    price: monthly.price,
  });
  const currentHistoryMembership = await createMembership({
    clientId: history.id,
    typeId: annual.id,
    startDate: dateFromToday(-10),
    endDate: dateFromToday(355),
    price: annual.price,
  });
  await createPayment(oldHistoryMembership.id, 50, "Efectivo", 100);
  await createPayment(currentHistoryMembership.id, 480, "Tarjeta", 10);
  await createCheckin(history.id, 20, 7);
  await createCheckin(history.id, 1, 19);

  // 9. Cliente inactivo, con datos incompletos y sin historial.
  await createClient({
    name: "Prueba Cliente Inactivo — Áñé",
    dni: "90000009",
    status: "inactive",
  });

  // 10. Cliente con nombre largo y membresía activa sin pagos/check-ins.
  await createMembership({
    clientId: (
      await createClient({
        name: "Prueba Nombre Muy Largo Para Verificar La Interfaz Responsiva",
        dni: "90000010",
        phone: "999000010",
      })
    ).id,
    typeId: monthly.id,
    startDate: dateFromToday(-1),
    endDate: dateFromToday(29),
    price: monthly.price,
  });

  const [clientCount, membershipCount, checkinCount, paymentCount] =
    await Promise.all([
      prisma.client.count(),
      prisma.membership.count(),
      prisma.checkin.count(),
      prisma.payment.count(),
    ]);

  console.log(`Created ${clientCount} test clients`);
  console.log(`Created ${membershipCount} test memberships`);
  console.log(`Created ${checkinCount} test check-ins`);
  console.log(`Created ${paymentCount} test payments`);
  console.log("Test database ready. Use the DNIs 90000001–90000010 to test.");
}

main()
  .catch((error) => {
    console.error("Test seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
