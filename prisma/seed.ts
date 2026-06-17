import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

async function main() {
  const adapter = new PrismaLibSql({
    url: "file:./dev.db",
  });

  const prisma = new PrismaClient({ adapter });

  console.log("Seeding database...");

  const membershipTypes = [
    { name: "Mensual", durationDays: 30, price: 50, description: "Membresía por un mes" },
    { name: "Trimestral", durationDays: 90, price: 135, description: "Membresía por tres meses" },
    { name: "Semestral", durationDays: 180, price: 255, description: "Membresía por seis meses" },
    { name: "Anual", durationDays: 365, price: 480, description: "Membresía por un año" },
  ];

  for (const type of membershipTypes) {
    await prisma.membershipType.upsert({
      where: { name: type.name },
      update: type,
      create: type,
    });
  }

  console.log("Seeded membership types");

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

  console.log("Seeded settings");

  // Limpiar datos existentes
  await prisma.payment.deleteMany();
  await prisma.checkin.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.client.deleteMany();
  console.log("Cleaned existing data");

  const clients = [
    { name: "Juan Pérez", dni: "12345678", phone: "987654321", email: "juan.perez@email.com" },
    { name: "María García", dni: "23456789", phone: "987654322", email: "maria.garcia@email.com" },
    { name: "Carlos López", dni: "34567890", phone: "987654323", email: "carlos.lopez@email.com" },
    { name: "Ana Martínez", dni: "45678901", phone: "987654324", email: "ana.martinez@email.com" },
    { name: "Roberto Sánchez", dni: "56789012", phone: "987654325", email: "roberto.sanchez@email.com" },
    { name: "Laura Rodríguez", dni: "67890123", phone: "987654326", email: "laura.rodriguez@email.com" },
    { name: "Miguel Fernández", dni: "78901234", phone: "987654327", email: "miguel.fernandez@email.com" },
    { name: "Carmen Torres", dni: "89012345", phone: "987654328", email: "carmen.torres@email.com" },
    { name: "Francisco Morales", dni: "90123456", phone: "987654329", email: "francisco.morales@email.com" },
    { name: "Isabel Ruiz", dni: "11223344", phone: "987654330", email: "isabel.ruiz@email.com" },
    { name: "Antonio Romero", dni: "22334455", phone: "987654331", email: "antonio.romero@email.com" },
    { name: "Lucía Vargas", dni: "33445566", phone: "987654332", email: "lucia.vargas@email.com" },
    { name: "José Delgado", dni: "44556677", phone: "987654333", email: "jose.delgado@email.com" },
    { name: "Patricia Jiménez", dni: "55667788", phone: "987654334", email: "patricia.jimenez@email.com" },
    { name: "Manuel Navarro", dni: "66778899", phone: "987654335", email: "manuel.navarro@email.com" },
    { name: "Eva Castro", dni: "77889900", phone: "987654336", email: "eva.castro@email.com" },
    { name: "David Merino", dni: "88990011", phone: "987654337", email: "david.merino@email.com" },
    { name: "Sofia Redondo", dni: "99001122", phone: "987654338", email: "sofia.redondo@email.com" },
    { name: "Pablo Iborra", dni: "11002233", phone: "987654339", email: "pablo.iborra@email.com" },
    { name: "Natalia Serrano", dni: "22113344", phone: "987654340", email: "natalia.serrano@email.com" },
    { name: "Hugo Ortiz", dni: "33224455", phone: "987654341", email: "hugo.ortiz@email.com" },
    { name: "Marta Gil", dni: "44335566", phone: "987654342", email: "marta.gil@email.com" },
    { name: "Javier Peña", dni: "55446677", phone: "987654343", email: "javier.pena@email.com" },
    { name: "Andrea León", dni: "66557788", phone: "987654344", email: "andrea.leon@email.com" },
    { name: "Sergio Mora", dni: "77668899", phone: "987654345", email: "sergio.mora@email.com" },
    { name: "Raquel Fuentes", dni: "88779900", phone: "987654346", email: "raquel.fuentes@email.com" },
    { name: "Alberto Castro", dni: "99880011", phone: "987654347", email: "alberto.castro@email.com" },
    { name: "Beatriz Gallo", dni: "11992233", phone: "987654348", email: "beatriz.gallo@email.com" },
    { name: "Diego Herrero", dni: "22003344", phone: "987654349", email: "diego.herrero@email.com" },
    { name: "Lidia Vidal", dni: "33114455", phone: "987654350", email: "lidia.vidal@email.com" },
    { name: "Pedro Rubio", dni: "44225566", phone: "987654351", email: "pedro.rubio@email.com" },
    { name: "Sandra Escobar", dni: "55336677", phone: "987654352", email: "sandra.escobar@email.com" },
    { name: "Jorge Pardo", dni: "66447788", phone: "987654353", email: "jorge.pardo@email.com" },
    { name: "Claudia Núñez", dni: "77558899", phone: "987654354", email: "claudia.nunez@email.com" },
    { name: "Fernando Vega", dni: "88669900", phone: "987654355", email: "fernando.vega@email.com" },
    { name: "Silvia Ortega", dni: "99770011", phone: "987654356", email: "silvia.ortega@email.com" },
    { name: "Roberto Alcázar", dni: "11881122", phone: "987654357", email: "roberto.alcazar@email.com" },
    { name: "Cristina Muñoz", dni: "22992233", phone: "987654358", email: "cristina.munoz@email.com" },
    { name: "Ángel Lorenzo", dni: "33003344", phone: "987654359", email: "angel.lorenzo@email.com" },
  ];

  const types = await prisma.membershipType.findMany();
  const typeMap: Record<string, { id: number; durationDays: number; price: number }> = {};
  types.forEach((t) => { typeMap[t.name] = { id: t.id, durationDays: t.durationDays, price: t.price }; });

  const today = new Date();
  const createdClients: { id: number; code: string }[] = [];

  for (let i = 0; i < clients.length; i++) {
    const client = await prisma.client.create({
      data: {
        code: `APG${String(i + 1).padStart(4, "0")}`,
        name: clients[i].name,
        dni: clients[i].dni,
        phone: clients[i].phone,
        email: clients[i].email,
        status: "active",
      },
    });
    createdClients.push({ id: client.id, code: client.code });
  }

  console.log(`Seeded ${createdClients.length} clients`);

  // Membresías para los primeros 30 clientes (APG0001 - APG0030)
  // - 10 Mensual activas (APG0001 - APG0010)
  // - 10 Trimestral activas (APG0011 - APG0020)
  // - 5 Semestral activas (APG0021 - APG0025)
  // - 5 Mensual vencidas (APG0026 - APG0030)
  // Los últimos 9 clientes (APG0031 - APG0039) NO tienen membresía

  const memberships: { id: number; clientId: number }[] = [];

  // APG0001 - APG0010: Mensual activa (30 días, empezó hace 15 días)
  for (let i = 0; i < 10; i++) {
    const client = createdClients[i];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 15);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);
    const type = typeMap["Mensual"];

    const membership = await prisma.membership.create({
      data: {
        clientId: client.id,
        typeId: type.id,
        startDate,
        endDate,
        status: "active",
        price: type.price,
      },
    });
    memberships.push({ id: membership.id, clientId: client.id });
  }

  // APG0011 - APG0020: Trimestral activa (90 días, empezó hace 60 días)
  for (let i = 10; i < 20; i++) {
    const client = createdClients[i];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 60);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 90);
    const type = typeMap["Trimestral"];

    const membership = await prisma.membership.create({
      data: {
        clientId: client.id,
        typeId: type.id,
        startDate,
        endDate,
        status: "active",
        price: type.price,
      },
    });
    memberships.push({ id: membership.id, clientId: client.id });
  }

  // APG0021 - APG0025: Semestral activa (180 días, empezó hace 90 días)
  for (let i = 20; i < 25; i++) {
    const client = createdClients[i];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 90);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 180);
    const type = typeMap["Semestral"];

    const membership = await prisma.membership.create({
      data: {
        clientId: client.id,
        typeId: type.id,
        startDate,
        endDate,
        status: "active",
        price: type.price,
      },
    });
    memberships.push({ id: membership.id, clientId: client.id });
  }

  // APG0026 - APG0030: Mensual vencida (30 días, empezó hace 60 días, ya venció)
  for (let i = 25; i < 30; i++) {
    const client = createdClients[i];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 60);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);
    const type = typeMap["Mensual"];

    const membership = await prisma.membership.create({
      data: {
        clientId: client.id,
        typeId: type.id,
        startDate,
        endDate,
        status: "expired",
        price: type.price,
      },
    });
    memberships.push({ id: membership.id, clientId: client.id });
  }

  // APG0031 - APG0039: SIN membresía (9 clientes)

  console.log(`Seeded ${memberships.length} memberships`);

  // Check-ins solo para clientes con membresía
  for (const membership of memberships) {
    const numCheckins = Math.floor(Math.random() * 15) + 5;
    for (let i = 0; i < numCheckins; i++) {
      const checkinDate = new Date(today);
      checkinDate.setDate(checkinDate.getDate() - Math.floor(Math.random() * 45));
      checkinDate.setHours(8 + Math.floor(Math.random() * 12), 0, 0, 0);

      await prisma.checkin.create({
        data: {
          clientId: membership.clientId,
          checkinDate,
        },
      });
    }
  }

  const checkinCount = await prisma.checkin.count();
  console.log(`Seeded ${checkinCount} checkins`);

  // Pagos para los primeros 25 memberships
  for (const membership of memberships.slice(0, 25)) {
    const paymentCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < paymentCount; i++) {
      const paymentDate = new Date(today);
      paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 30));

      await prisma.payment.create({
        data: {
          membershipId: membership.id,
          amount: 50,
          paymentMethod: ["Efectivo", "Tarjeta", "Transferencia"][Math.floor(Math.random() * 3)],
          paymentDate,
        },
      });
    }
  }

  const paymentCount = await prisma.payment.count();
  console.log(`Seeded ${paymentCount} payments`);

  console.log("Seeding complete!");
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
