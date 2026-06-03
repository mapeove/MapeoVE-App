import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Let's run raw SQL queries to see database variables or vault secrets
    console.log("Querying database parameters...");
    const r1 = await prisma.$queryRawUnsafe("SHOW ALL;");
    console.log("R1 type:", typeof r1);
    
    // We can also query pg_settings for jwt
    const r2 = await prisma.$queryRawUnsafe("SELECT name, setting FROM pg_settings WHERE name LIKE '%jwt%' OR name LIKE '%secret%';");
    console.log("Settings matching jwt/secret:", JSON.stringify(r2, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
