import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking if we are superuser...");
    const isSuper = await prisma.$queryRawUnsafe(`
      SELECT rolsuper FROM pg_roles WHERE rolname = current_user;
    `);
    console.log("Current user is superuser:", isSuper);

    console.log("Attempting to grant usage on vault schema...");
    await prisma.$queryRawUnsafe(`
      GRANT USAGE ON SCHEMA vault TO postgres;
    `);
    console.log("Granted usage successfully!");

    await prisma.$queryRawUnsafe(`
      GRANT SELECT ON ALL TABLES IN SCHEMA vault TO postgres;
    `);
    console.log("Granted select successfully!");

    const secrets = await prisma.$queryRawUnsafe(`
      SELECT * FROM vault.decrypted_secrets LIMIT 10;
    `);
    console.log("Secrets:", secrets);
  } catch (error) {
    console.error("Error in grant or query:", error);
  }
}

main();
