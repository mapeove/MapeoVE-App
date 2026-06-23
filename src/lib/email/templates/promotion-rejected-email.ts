import { getEmailLayout } from "../email-layout";

export function promotionRejectedEmail(businessName: string, type: string, rejectionReason: string) {
  const typeLabels: Record<string, string> = {
    FEATURED: "Negocio destacado",
    SPONSORED_CATEGORY: "Categoría patrocinada",
    LOCAL_BANNER: "Banner local",
    PREMIUM: "Plan Premium"
  };
  const label = typeLabels[type] || type;

  const content = `
    <h2 style="color: #1f2937; margin-bottom: 20px; text-align: center;">Solicitud de promoción rechazada</h2>
    <p style="color: #4b5563; font-size: 16px; margin-bottom: 15px;">
      Hola, lamentamos informarte que tu solicitud de promoción (<strong>${label}</strong>) para el negocio <strong>${businessName}</strong> no ha podido ser procesada.
    </p>
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 10px; color: #991b1b; font-size: 14px; text-transform: uppercase; font-weight: bold; text-align: center;">Posible Motivo</p>
      <p style="color: #b91c1c; font-size: 15px; margin: 0; text-align: center;">
        ${rejectionReason || "Pago no confirmado, monto incorrecto, hash inválido o datos incompletos."}
      </p>
    </div>
    <p style="color: #4b5563; font-size: 16px; margin-bottom: 25px; text-align: center;">
      Por favor, verifica los datos e intenta enviar la solicitud nuevamente o contacta a soporte.
    </p>
    <div style="text-align: center;">
      <a href="\${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background-color 0.2s;">
        Ir a MapeoVE
      </a>
    </div>
  `;

  return getEmailLayout({ title: "MapeoVE Promociones", contentHtml: content });
}
