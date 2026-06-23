import { getEmailLayout } from "../email-layout";

export function promotionRequestReceivedEmail(businessName: string, type: string) {
  const typeLabels: Record<string, string> = {
    FEATURED: "Negocio destacado",
    SPONSORED_CATEGORY: "Categoría patrocinada",
    LOCAL_BANNER: "Banner local",
    PREMIUM: "Plan Premium"
  };
  const label = typeLabels[type] || type;

  const content = `
    <h2 style="color: #1f2937; margin-bottom: 20px; text-align: center;">Solicitud de promoción recibida</h2>
    <p style="color: #4b5563; font-size: 16px; margin-bottom: 15px;">
      Hola, hemos recibido tu solicitud de promoción para el negocio <strong>${businessName}</strong>.
    </p>
    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: center;">
      <p style="margin: 0; color: #4b5563; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Promoción Solicitada</p>
      <p style="margin: 10px 0 0; color: #2563eb; font-size: 24px; font-weight: bold;">${label}</p>
    </div>
    <p style="color: #4b5563; font-size: 16px; margin-bottom: 25px; text-align: center;">
      Tu solicitud y el pago están siendo verificados. Tiempo máximo estimado: 5 horas.
    </p>
    <div style="text-align: center;">
      <a href="\${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background-color 0.2s;">
        Ir a MapeoVE
      </a>
    </div>
  `;

  return getEmailLayout({ title: "MapeoVE Promociones", contentHtml: content });
}
