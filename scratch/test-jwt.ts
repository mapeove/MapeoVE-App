import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const keys = [
    "app.settings.jwt_secret",
    "jwt.secret",
    "app.settings.jwt_exp",
    "app.settings.service_role_key",
    "app.settings.anon_key"
  ];
  for (const key of keys) {
    try {
      const res = await prisma.$queryRawUnsafe(`SELECT current_setting('${key}', true) as val;`);
      console.log(`${key}:`, res);
    } catch (e) {
      console.error(`Error for ${key}:`, e);
    }
  }
}

main();
