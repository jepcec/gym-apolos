const fs = require("fs");
const path = require("path");

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
  path.join(rootDir, "dev.db"),
  "Database file"
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

console.log("\nElectron build preparation complete.");
console.log("Run 'npx electron-builder build --win' to create the installer.");
