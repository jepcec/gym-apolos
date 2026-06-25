import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

async function main() {
  const adapter = new PrismaLibSql({
    url: "file:./dev-clean.db",
  });

  const prisma = new PrismaClient({ adapter });

  console.log("Seeding production database...");

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
    { key: "backup_auto_enabled", value: "false" },
    { key: "backup_frequency", value: "daily" },
    { key: "backup_retention_count", value: "10" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log("Seeded settings");
  console.log("Production seeding complete!");
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
