import { PrismaClient } from "@prisma/client";

async function main() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    console.error("DIRECT_URL not found in env");
    return;
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: directUrl,
      },
    },
  });

  const keys = [
    "app.settings.jwt_secret",
    "jwt.secret",
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

  // Let's also check if we can read the vault or config settings via raw query
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT * FROM pg_settings WHERE name LIKE '%jwt%' OR name LIKE '%secret%';
    `);
    console.log("pg_settings direct:", res);
  } catch (e) {
    console.error("Error reading pg_settings direct:", e);
  }

  await prisma.$disconnect();
}

main();
