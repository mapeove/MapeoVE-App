import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const buckets = await prisma.$queryRawUnsafe(`
      SELECT * FROM storage.buckets;
    `);
    console.log("Buckets:", buckets);
  } catch (error) {
    console.error("Error reading buckets:", error);
  }
}

main();
