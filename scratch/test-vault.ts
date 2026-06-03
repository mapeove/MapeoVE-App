import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const secrets = await prisma.$queryRawUnsafe(`
      SELECT * FROM vault.decrypted_secrets LIMIT 10;
    `);
    console.log("Decrypted secrets:", JSON.stringify(secrets, null, 2));
  } catch (error) {
    console.error("Error reading decrypted secrets:", error);
  }

  try {
    const secrets2 = await prisma.$queryRawUnsafe(`
      SELECT * FROM vault.secrets LIMIT 10;
    `);
    console.log("Secrets:", JSON.stringify(secrets2, null, 2));
  } catch (error) {
    console.error("Error reading secrets:", error);
  }
}

main();
