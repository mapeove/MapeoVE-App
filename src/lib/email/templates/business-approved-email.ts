import { getEmailLayout } from "../email-layout";

interface BusinessApprovedEmailProps {
  ownerName: string;
  businessName: string;
  appUrl: string;
}

export function getBusinessApprovedEmailHtml({ ownerName, businessName, appUrl }: BusinessApprovedEmailProps): string {
  const title = "Tu negocio fue aprobado en MapeoVE";

  const contentHtml = `
    <h2 style="color: #0B3D91; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: bold;">¡Hola, ${ownerName}!</h2>
    <p style="margin-top: 0; margin-bottom: 20px;">
      Nos complace informarte que tu solicitud para registrar el negocio <strong>${businessName}</strong> ha sido aprobada por nuestro equipo administrativo.
    </p>
    <p style="margin-bottom: 25px;">
      Tu negocio ya se encuentra activo y es visible para todos los usuarios dentro del mapa comercial interactivo de <strong>MapeoVE</strong>.
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #22C55E; padding: 15px 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0; color: #15803d; font-size: 14px;">
      <strong>✓ Tu local ya está en el mapa:</strong> Ahora los clientes cercanos pueden localizar tu establecimiento, ver tus datos de contacto (WhatsApp, teléfono, redes sociales), tus fotos y tus horarios de atención.
    </div>

    <p style="margin-bottom: 30px; text-align: center;">
      Puedes acceder a MapeoVE para visualizar tu negocio o realizar cambios en su información:
    </p>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${appUrl}" target="_blank" style="background-color: #0B3D91; color: #ffffff !important; display: inline-block; padding: 12px 30px; font-size: 14px; font-weight: bold; text-decoration: none !important; border-radius: 8px; box-shadow: 0 4px 6px rgba(11, 61, 145, 0.15); text-align: center;">
        Ver MapeoVE
      </a>
    </div>

    <p style="margin-bottom: 0; font-size: 14px; color: #7f8c8d;">
      El equipo de MapeoVE.
    </p>
  `;

  return getEmailLayout({
    title,
    preheader: `Tu negocio "${businessName}" ya está activo y visible en el mapa de MapeoVE.`,
    contentHtml,
  });
}
