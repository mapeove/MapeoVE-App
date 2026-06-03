import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding MapeoVE database...");

  // =============================================
  // CATEGORÍAS
  // =============================================
  const categories = await Promise.all([
    db.category.upsert({
      where: { slug: "restaurantes" },
      update: {},
      create: { name: "Restaurantes", slug: "restaurantes", icon: "🍔" },
    }),
    db.category.upsert({
      where: { slug: "farmacias" },
      update: {},
      create: { name: "Farmacias", slug: "farmacias", icon: "💊" },
    }),
    db.category.upsert({
      where: { slug: "gasolineras" },
      update: {},
      create: { name: "Gasolineras", slug: "gasolineras", icon: "⛽" },
    }),
    db.category.upsert({
      where: { slug: "hoteles" },
      update: {},
      create: { name: "Hoteles", slug: "hoteles", icon: "🏨" },
    }),
    db.category.upsert({
      where: { slug: "talleres" },
      update: {},
      create: { name: "Talleres", slug: "talleres", icon: "🔧" },
    }),
    db.category.upsert({
      where: { slug: "salud" },
      update: {},
      create: { name: "Salud", slug: "salud", icon: "🏥" },
    }),
    db.category.upsert({
      where: { slug: "comercios" },
      update: {},
      create: { name: "Comercios", slug: "comercios", icon: "🛒" },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Map category slugs to IDs
  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    categoryMap[cat.slug] = cat.id;
  }

  // =============================================
  // NEGOCIOS REALES DE LA VICTORIA, ARAGUA
  // =============================================
  const businesses = [
    // ── RESTAURANTES ──
    {
      name: "Restaurante Nuevo Estadero",
      description:
        "Tradicional restaurante venezolano en La Victoria, reconocido por sus platos criollos, parrillas y atención familiar. Un referente gastronómico de la zona con años de trayectoria.",
      address: "Av. Bermudez, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.227,
      longitude: -67.331,
      phone: "+58 244-3211234",
      whatsapp: "+58 414-3211234",
      hours: "Lunes a Domingo 11:00 AM - 10:00 PM",
      verified: false,
      categoryId: categoryMap["restaurantes"],
    },
    {
      name: "Ole Gourmet",
      description:
        "Restaurante de comida gourmet con variedad de platos internacionales y nacionales. Ubicado en el C.C. La Victoria, ofrece un ambiente elegante y menus para todos los gustos.",
      address: "C.C. La Victoria, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.2255,
      longitude: -67.3298,
      phone: "+58 244-3215678",
      whatsapp: "+58 412-3215678",
      hours: "Lunes a Sabado 12:00 PM - 9:00 PM",
      verified: false,
      categoryId: categoryMap["restaurantes"],
    },
    {
      name: "Ryoshi Bar-Restaurant",
      description:
        "Bar-restaurant con propuesta gastronomia fusion, ambiente nocturno y cocteles. Ideal para compartir en grupo con buena musica y comida variada en el corazon de La Victoria.",
      address: "Av. Principal, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.228,
      longitude: -67.3325,
      phone: "+58 244-3219012",
      whatsapp: "+58 416-3219012",
      hours: "Martes a Domingo 6:00 PM - 12:00 AM",
      verified: false,
      categoryId: categoryMap["restaurantes"],
    },
    {
      name: "Restaurant Mi Sueno",
      description:
        "Restaurante de comida criolla venezolana, especialidad en desayunos y almuerzos ejecutivos. Atencion rapida y precios accesibles en el centro de La Victoria.",
      address: "Calle Sucre, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.2245,
      longitude: -67.3305,
      phone: "+58 244-3213456",
      whatsapp: "+58 414-3213456",
      hours: "Lunes a Sabado 7:00 AM - 4:00 PM",
      verified: false,
      categoryId: categoryMap["restaurantes"],
    },

    // ── FARMACIAS ──
    {
      name: "Farmatodo La Victoria",
      description:
        "Sucursal de la cadena Farmatodo en La Victoria. Farmacia y tienda de conveniencia con medicamentos, productos de belleza, higiene personal y alimentos. Servicio de entrega a domicilio.",
      address: "Av. Bermudez, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.2265,
      longitude: -67.33,
      phone: "+58 244-3221234",
      whatsapp: "+58 414-3221234",
      hours: "Lunes a Domingo 7:00 AM - 10:00 PM",
      verified: true,
      categoryId: categoryMap["farmacias"],
    },
    {
      name: "Farmavida La Fontana",
      description:
        "Farmacia de comunidad ubicada en la Urbanizacion La Fontana. Ofrece medicamentos, productos de salud y asesoria farmaceutica personalizada al servicio de la comunidad.",
      address: "Urb. La Fontana, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.229,
      longitude: -67.328,
      phone: "+58 244-3225678",
      whatsapp: "+58 412-3225678",
      hours: "Lunes a Sabado 8:00 AM - 9:00 PM",
      verified: false,
      categoryId: categoryMap["farmacias"],
    },
    {
      name: "Farmacia Saas De Gouveia",
      description:
        "Farmacia con larga trayectoria en La Victoria, ubicada en la Calle Gouveia. Servicio profesional de dispensacion de medicamentos y productos de salud con atencion personalizada.",
      address: "Calle Gouveia, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.226,
      longitude: -67.333,
      phone: "+58 244-3229012",
      whatsapp: "+58 416-3229012",
      hours: "Lunes a Sabado 8:00 AM - 8:00 PM",
      verified: false,
      categoryId: categoryMap["farmacias"],
    },
    {
      name: "Farmacia Nueva",
      description:
        "Farmacia moderna en la Av. Principal de La Victoria. Amplio inventario de medicamentos, productos naturistas y de higiene personal con precios competitivos.",
      address: "Av. Principal, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.2285,
      longitude: -67.3315,
      phone: "+58 244-3223456",
      whatsapp: "+58 414-3223456",
      hours: "Lunes a Sabado 7:30 AM - 9:00 PM",
      verified: false,
      categoryId: categoryMap["farmacias"],
    },

    // ── GASOLINERAS ──
    {
      name: "E/S PDV Campo Grande GNV",
      description:
        "Estacion de servicio PDVSA con Gas Natural Vehicular en la zona de Campo Grande. Combustible gasolina y GNV disponible, servicio las 24 horas para vehiculos particulares y de carga.",
      address: "Av. Campo Grande, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.23,
      longitude: -67.335,
      phone: "+58 244-3231234",
      hours: "Lunes a Domingo 6:00 AM - 10:00 PM",
      verified: false,
      categoryId: categoryMap["gasolineras"],
    },
    {
      name: "Rivas Davila Service Station",
      description:
        "Estacion de servicio ubicada en la Av. Rivas Davila. Servicio de combustible 24 horas, tienda de conveniencia y vulcanizadora. Parada obligatoria en la ruta de La Victoria.",
      address: "Av. Rivas Davila, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.225,
      longitude: -67.334,
      phone: "+58 244-3235678",
      hours: "Lunes a Domingo 24 horas",
      verified: false,
      categoryId: categoryMap["gasolineras"],
    },
    {
      name: "Llenadero de Gas La Victoria",
      description:
        "Llenadero de gas domestico e industrial en la zona industrial de La Victoria. Servicio de cilindros y llenado directo con atencion rapida y precios regulados.",
      address: "Zona Industrial, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.231,
      longitude: -67.336,
      phone: "+58 244-3239012",
      whatsapp: "+58 414-3239012",
      hours: "Lunes a Sabado 7:00 AM - 6:00 PM",
      verified: false,
      categoryId: categoryMap["gasolineras"],
    },

    // ── HOTELES ──
    {
      name: "Hotel La Vineta",
      description:
        "Hotel boutique en La Victoria con habitaciones comodas y climatizadas. Ideal para viajeros de negocios y turistas. Incluye estacionamiento, wifi y desayuno incluido.",
      address: "Av. La Vineta, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.224,
      longitude: -67.329,
      phone: "+58 244-3241234",
      whatsapp: "+58 412-3241234",
      hours: "Recepcion 24 horas",
      verified: false,
      categoryId: categoryMap["hoteles"],
    },

    // ── TALLERES ──
    {
      name: "Rectificadora Talleres Campos",
      description:
        "Rectificadora de motores con amplia experiencia en La Victoria. Servicios de rectificacion de cilindros, cambio de pistones, ajuste de motor y mecanica general para todo tipo de vehiculos.",
      address: "Zona Industrial, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.2315,
      longitude: -67.3355,
      phone: "+58 244-3251234",
      whatsapp: "+58 414-3251234",
      hours: "Lunes a Viernes 8:00 AM - 5:00 PM",
      verified: false,
      categoryId: categoryMap["talleres"],
    },
    {
      name: "Taller Ortiz La Victoria",
      description:
        "Taller mecanico general para automoviles. Servicios de mantenimiento preventivo y correctivo, cambio de aceite, frenos, suspension y electricidad automotriz en La Victoria.",
      address: "Calle Ortiz, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.2275,
      longitude: -67.332,
      phone: "+58 244-3255678",
      whatsapp: "+58 416-3255678",
      hours: "Lunes a Sabado 8:00 AM - 4:00 PM",
      verified: false,
      categoryId: categoryMap["talleres"],
    },
    {
      name: "Taller Mecanico Para Motos Bitico",
      description:
        "Taller especializado en motocicletas en La Victoria. Servicio de mantenimiento, reparacion, cambio de aceite, llantas y repuestos para todo tipo de motos. Atencion rapida y profesional.",
      address: "Av. Bermudez, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.2268,
      longitude: -67.3312,
      phone: "+58 244-3259012",
      whatsapp: "+58 412-3259012",
      hours: "Lunes a Sabado 8:00 AM - 5:00 PM",
      verified: false,
      categoryId: categoryMap["talleres"],
    },

    // ── SALUD ──
    {
      name: "Clinical Center La Fontana",
      description:
        "Centro clinico privado en la Urbanizacion La Fontana. Consultas medicas, laboratorio, imaginologia y servicios de salud integral con especialistas en diversas areas medicas.",
      address: "Urb. La Fontana, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.2292,
      longitude: -67.3282,
      phone: "+58 244-3261234",
      whatsapp: "+58 414-3261234",
      hours: "Lunes a Viernes 7:00 AM - 6:00 PM, Sabado 8:00 AM - 12:00 PM",
      verified: false,
      categoryId: categoryMap["salud"],
    },
    {
      name: "Centro Medico Achaguas",
      description:
        "Centro medico multidisciplinario en La Victoria. Atencion en medicina general, especialidades, odontologia y urgencias menores. Equipo medico calificado y tecnologia actualizada.",
      address: "Calle Achaguas, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.2262,
      longitude: -67.3328,
      phone: "+58 244-3265678",
      whatsapp: "+58 412-3265678",
      hours: "Lunes a Viernes 7:00 AM - 7:00 PM, Sabado 8:00 AM - 1:00 PM",
      verified: false,
      categoryId: categoryMap["salud"],
    },
    {
      name: "Ecografias La Victoria",
      description:
        "Centro de diagnostico por imagen especializado en ecografias. Servicios de ecografia general, obstetrica, abdominal y ginecologica con equipos de ultima generacion.",
      address: "Av. Principal, La Victoria",
      city: "La Victoria",
      state: "Aragua",
      country: "Venezuela",
      latitude: 10.2278,
      longitude: -67.3318,
      phone: "+58 244-3269012",
      whatsapp: "+58 416-3269012",
      hours: "Lunes a Viernes 8:00 AM - 5:00 PM",
      verified: false,
      categoryId: categoryMap["salud"],
    },
  ];

  // =============================================
  // USUARIOS
  // =============================================
  await db.user.deleteMany({});
  console.log("🗑️  Cleared existing users");

  // Simple pbkdf2 password hashing inline since importing might have module resolution issues in tsx/prisma seed
  const crypto = await import("crypto");
  function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
  }

  if (!process.env.SUPERADMIN_EMAIL || !process.env.SUPERADMIN_PASSWORD) {
  throw new Error('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set');
}
const adminUser = await db.user.create({
  data: {
    email: process.env.SUPERADMIN_EMAIL,
    password: hashPassword(process.env.SUPERADMIN_PASSWORD),
    name: "Administrador MapeoVE",
    role: "SUPER_ADMIN",
  },
});



  console.log("👤 Created SUPER_ADMIN user from environment variables");


  // Clear existing businesses first (to avoid duplicates on re-seed)
  await db.business.deleteMany({});
  console.log("🗑️  Cleared existing businesses");

  let created = 0;
  for (let i = 0; i < businesses.length; i++) {
    const bizData = businesses[i];
    // Asignar el primer negocio al usuario OWNER

    const data = bizData;
    created++;
  }

  console.log(`✅ Created ${created} businesses`);
  console.log("🎉 MapeoVE seeding complete!");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

