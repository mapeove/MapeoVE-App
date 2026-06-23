import { getEmailLayout } from "../email-layout";

export function promotionExpiryReminderEmail(businessName: string, type: string, approvedAt: string, expiresAt: string) {
  const typeLabels: Record<string, string> = {
    FEATURED: "Negocio destacado",
    SPONSORED_CATEGORY: "Categoría patrocinada",
    LOCAL_BANNER: "Banner local",
    PREMIUM: "Plan Premium"
  };
  const label = typeLabels[type] || type;

  const content = `
    <h2 style="color: #1f2937; margin-bottom: 20px; text-align: center;">¡Tu promoción está por vencer!</h2>
    <p style="color: #4b5563; font-size: 16px; margin-bottom: 15px;">
      Hola, te recordamos que la promoción activa para el negocio <strong>${businessName}</strong> vencerá en 3 días.
    </p>
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 10px; color: #92400e; font-size: 14px; text-transform: uppercase; font-weight: bold; text-align: center;">Detalles de la Promoción</p>
      <ul style="color: #b45309; list-style: none; padding: 0; margin: 0; font-size: 15px;">
        <li style="margin-bottom: 8px;"><strong>Tipo:</strong> ${label}</li>
        <li style="margin-bottom: 8px;"><strong>Aprobada el:</strong> ${new Date(approvedAt).toLocaleDateString()}</li>
        <li style="margin-bottom: 0;"><strong>Finaliza el:</strong> ${new Date(expiresAt).toLocaleDateString()}</li>
      </ul>
    </div>
    <p style="color: #4b5563; font-size: 16px; margin-bottom: 25px; text-align: center;">
      Si deseas mantener los beneficios, por favor solicita una renovación desde tu panel.
    </p>
    <div style="text-align: center;">
      <a href="\${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background-color 0.2s;">
        Renovar en MapeoVE
      </a>
    </div>
  `;

  return getEmailLayout({ title: "MapeoVE Promociones", contentHtml: content });
}
