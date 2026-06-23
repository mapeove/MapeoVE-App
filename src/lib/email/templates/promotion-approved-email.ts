import { getEmailLayout } from "../email-layout";

export function promotionApprovedEmail(businessName: string, type: string, startsAt: string, expiresAt: string) {
  const typeLabels: Record<string, string> = {
    FEATURED: "Negocio destacado",
    SPONSORED_CATEGORY: "Categoría patrocinada",
    LOCAL_BANNER: "Banner local",
    PREMIUM: "Plan Premium"
  };
  const label = typeLabels[type] || type;

  const content = `
    <h2 style="color: #1f2937; margin-bottom: 20px; text-align: center;">¡Promoción Aprobada!</h2>
    <p style="color: #4b5563; font-size: 16px; margin-bottom: 15px;">
      Hola, tu solicitud de promoción para el negocio <strong>${businessName}</strong> ha sido verificada y activada exitosamente.
    </p>
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 10px; color: #166534; font-size: 14px; text-transform: uppercase; font-weight: bold; text-align: center;">Detalles de tu Promoción</p>
      <ul style="color: #15803d; list-style: none; padding: 0; margin: 0; font-size: 15px;">
        <li style="margin-bottom: 8px;"><strong>Tipo:</strong> ${label}</li>
        <li style="margin-bottom: 8px;"><strong>Inicio:</strong> ${new Date(startsAt).toLocaleDateString()}</li>
        <li style="margin-bottom: 0;"><strong>Vencimiento:</strong> ${new Date(expiresAt).toLocaleDateString()}</li>
      </ul>
    </div>
    <div style="text-align: center;">
      <a href="\${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background-color 0.2s;">
        Ver en MapeoVE
      </a>
    </div>
  `;

  return getEmailLayout({ title: "MapeoVE Promociones", contentHtml: content });
}
