import { getEmailLayout } from "../email-layout";

interface BusinessRejectedEmailProps {
  ownerName: string;
  businessName: string;
  appUrl: string;
}

export function getBusinessRejectedEmailHtml({ ownerName, businessName, appUrl }: BusinessRejectedEmailProps): string {
  const title = "Solicitud de negocio no aprobada en MapeoVE";

  const contentHtml = `
    <h2 style="color: #0B3D91; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: bold;">Hola, ${ownerName}</h2>
    <p style="margin-top: 0; margin-bottom: 20px;">
      Agradecemos tu interés en formar parte de <strong>MapeoVE</strong>. Queremos informarte que, tras la revisión de tu solicitud para el comercio <strong>${businessName}</strong>, ésta no pudo ser aprobada en este momento.
    </p>
    
    <div style="background-color: #fff9e6; border-left: 4px solid #F4C430; padding: 15px 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0; color: #7d6608; font-size: 14px;">
      <strong style="display: block; margin-bottom: 8px;">Motivos comunes de no aprobación:</strong>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
        <li style="margin-bottom: 6px;"><strong>Pago no verificado:</strong> Los datos de la transferencia o referencia de pago no pudieron ser validados.</li>
        <li style="margin-bottom: 6px;"><strong>Datos incompletos:</strong> Falta información clave como la ubicación exacta, fotos obligatorias o números de contacto.</li>
        <li style="margin-bottom: 6px;"><strong>Información no válida:</strong> Los datos ingresados contienen errores tipográficos o no cumplen con los estándares de la plataforma.</li>
        <li style="margin-bottom: 0;"><strong>Revisión administrativa:</strong> La información no coincide con un comercio físico verídico.</li>
      </ul>
    </div>

    <p style="margin-bottom: 25px;">
      Te invitamos a revisar los datos del registro, verificar la referencia de tu pago y volver a intentarlo. Si tienes dudas, puedes ponerte en contacto con nuestro equipo de soporte técnico.
    </p>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${appUrl}" target="_blank" style="background-color: #0B3D91; color: #ffffff !important; display: inline-block; padding: 12px 30px; font-size: 14px; font-weight: bold; text-decoration: none !important; border-radius: 8px; box-shadow: 0 4px 6px rgba(11, 61, 145, 0.15); text-align: center;">
        Entrar a MapeoVE
      </a>
    </div>

    <p style="margin-bottom: 0; font-size: 14px; color: #7f8c8d;">
      El equipo de MapeoVE.
    </p>
  `;

  return getEmailLayout({
    title,
    preheader: `Tu solicitud para "${businessName}" no pudo ser aprobada. Revisa los detalles.`,
    contentHtml,
  });
}
