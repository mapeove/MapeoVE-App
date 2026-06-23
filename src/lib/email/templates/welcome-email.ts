import { getEmailLayout } from "../email-layout";

interface WelcomeEmailProps {
  name?: string;
}

export function getWelcomeEmailHtml({ name }: WelcomeEmailProps = {}): string {
  const greetingName = name ? ` ${name}` : "";
  const title = "¡Te damos la bienvenida a MapeoVE!";

  const contentHtml = `
    <h2 style="color: #0B3D91; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: bold;">¡Hola${greetingName}!</h2>
    <p style="margin-top: 0; margin-bottom: 20px;">
      Muchas gracias por registrarte en <strong>MapeoVE</strong>, la plataforma líder de geolocalización y mapa comercial de comercios en Venezuela.
    </p>
    <p style="margin-bottom: 25px;">
      Nuestra misión es hacer visibles todos los negocios, locales y emprendimientos, ayudándote a conectar con más clientes en tu zona y permitiendo a los usuarios descubrir las mejores opciones cerca de ellos.
    </p>
    
    <div style="background-color: #f8fafc; border-left: 4px solid #0B3D91; padding: 15px 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
      <h4 style="margin-top: 0; margin-bottom: 10px; color: #0B3D91; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Con MapeoVE podrás:</h4>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
        <li style="margin-bottom: 8px;"><strong>Explorar el mapa comercial:</strong> Encuentra farmacias, restaurantes, hoteles, talleres y más locales a tu alrededor de forma rápida y sin complicaciones.</li>
        <li style="margin-bottom: 8px;"><strong>Registrar tu propio local:</strong> Da de alta tu comercio, agrega tu dirección, métodos de contacto (WhatsApp, teléfono, redes sociales) y horario de atención.</li>
        <li style="margin-bottom: 8px;"><strong>Añadir fotos profesionales:</strong> Sube imágenes de tu establecimiento para generar confianza e invitar a visitarte.</li>
        <li style="margin-bottom: 8px;"><strong>Rutas inteligentes:</strong> Usa nuestro sistema de navegación en tiempo real para saber exactamente cómo llegar a cualquier establecimiento.</li>
        <li style="margin-bottom: 0;"><strong>Ganar visibilidad:</strong> Posiciona tu comercio en los mapas y listados de búsqueda local.</li>
      </ul>
    </div>

    <p style="margin-bottom: 30px; text-align: center;">
      ¿Listo para empezar a explorar o registrar tu establecimiento?
    </p>

    <div style="margin: 30px 0; text-align: center;">
      <a href="https://mapeove.com" target="_blank" style="background-color: #0B3D91; color: #ffffff !important; display: inline-block; padding: 12px 30px; font-size: 14px; font-weight: bold; text-decoration: none !important; border-radius: 8px; box-shadow: 0 4px 6px rgba(11, 61, 145, 0.15); text-align: center;">
        Entrar a MapeoVE
      </a>
    </div>

    <p style="margin-bottom: 0; font-size: 14px; color: #7f8c8d;">
      El equipo de MapeoVE.
    </p>
  `;

  return getEmailLayout({
    title,
    preheader: "Te damos la bienvenida a MapeoVE, el mapa comercial de Venezuela.",
    contentHtml,
  });
}
