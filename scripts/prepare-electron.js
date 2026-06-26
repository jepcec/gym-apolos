const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.join(__dirname, "..");

function checkFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: ${description} not found at: ${filePath}`);
    console.error("Please run 'npm run build' first.");
    process.exit(1);
  }
  console.log(`OK: ${description} found`);
}

console.log("Preparing Electron build...\n");

checkFile(
  path.join(rootDir, ".next", "standalone", "server.js"),
  "Next.js standalone server"
);

checkFile(
  path.join(rootDir, ".next", "static"),
  "Next.js static files"
);

const iconPath = path.join(rootDir, "electron", "icon.ico");
if (!fs.existsSync(iconPath)) {
  console.log("WARN: No icon.ico found in electron/. Build will use default icon.");
} else {
  console.log("OK: App icon found");
}

const prismaGenerated = path.join(rootDir, "app", "generated", "prisma");
if (!fs.existsSync(prismaGenerated)) {
  console.error("ERROR: Prisma client not generated.");
  console.error("Please run 'npm run db:generate' first.");
  process.exit(1);
}
console.log("OK: Prisma client generated");

console.log("\nCreating clean production database...");

const cleanDbPath = path.join(rootDir, "dev-clean.db");
const cleanDbJournal = path.join(rootDir, "dev-clean.db-journal");

if (fs.existsSync(cleanDbPath)) {
  fs.unlinkSync(cleanDbPath);
}
if (fs.existsSync(cleanDbJournal)) {
  fs.unlinkSync(cleanDbJournal);
}

try {
  execSync("npx prisma db push --url file:./dev-clean.db --force-reset", {
    cwd: rootDir,
    stdio: "inherit",
  });
  console.log("OK: Database structure created");

  execSync("npx tsx prisma/seed-production.ts", {
    cwd: rootDir,
    stdio: "inherit",
  });
  console.log("OK: Production seed completed");
} catch (error) {
  console.error("ERROR: Failed to create clean database");
  process.exit(1);
}

console.log("\nElectron build preparation complete.");
console.log("Run 'npx electron-builder build --win' to create the installer.");
