import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT name, setting FROM pg_settings WHERE name LIKE 'app.settings.%';
    `);
    console.log("App settings:", res);
  } catch (error) {
    console.error("Error reading pg_settings:", error);
  }
}

main();
