import { resend } from '../resend';
import { promotionRequestReceivedEmail } from './templates/promotion-request-received-email';
import { promotionApprovedEmail } from './templates/promotion-approved-email';
import { promotionRejectedEmail } from './templates/promotion-rejected-email';
import { promotionExpiryReminderEmail } from './templates/promotion-expiry-reminder-email';

const fromEmail = process.env.EMAIL_FROM || 'MapeoVE <no-reply@mapeove.com>';

export async function sendPromotionReceivedEmail(to: string, businessName: string, type: string) {
  if (!resend) return;
  return resend.emails.send({
    from: fromEmail,
    to,
    subject: `Solicitud de promoción recibida - ${businessName}`,
    html: promotionRequestReceivedEmail(businessName, type),
  });
}

export async function sendPromotionApprovedEmail(to: string, businessName: string, type: string, startsAt: Date, expiresAt: Date) {
  if (!resend) return;
  return resend.emails.send({
    from: fromEmail,
    to,
    subject: `¡Promoción Aprobada! - ${businessName}`,
    html: promotionApprovedEmail(businessName, type, startsAt.toISOString(), expiresAt.toISOString()),
  });
}

export async function sendPromotionRejectedEmail(to: string, businessName: string, type: string, reason: string) {
  if (!resend) return;
  return resend.emails.send({
    from: fromEmail,
    to,
    subject: `Promoción Rechazada - ${businessName}`,
    html: promotionRejectedEmail(businessName, type, reason),
  });
}

export async function sendPromotionExpiryReminderEmail(to: string, businessName: string, type: string, approvedAt: Date, expiresAt: Date) {
  if (!resend) return;
  return resend.emails.send({
    from: fromEmail,
    to,
    subject: `Tu promoción vencerá pronto - ${businessName}`,
    html: promotionExpiryReminderEmail(businessName, type, approvedAt.toISOString(), expiresAt.toISOString()),
  });
}

export async function sendPromotionAdminNotificationEmail(params: {
  businessName: string;
  type: string;
  baseAmount: number;
  feeAmount: number;
  totalAmount: number;
  transactionHash: string;
  userEmail: string;
  isRenewal?: boolean;
}) {
  if (!resend) return;

  const typeLabels: Record<string, string> = {
    FEATURED: "Negocio destacado",
    SPONSORED_CATEGORY: "Categoría patrocinada",
    LOCAL_BANNER: "Banner local",
    PREMIUM: "Plan Premium"
  };
  const label = typeLabels[params.type] || params.type;

  const content = `
    <h2 style="color: #0B3D91; margin-bottom: 20px; text-align: center;">Nueva Solicitud de Promoción</h2>
    <p style="color: #4b5563; font-size: 15px; margin-bottom: 15px;">
      Se ha recibido una nueva solicitud de promoción para verificar en MapeoVE:
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; border: 1px solid #e5e7eb;">
      <tr style="background-color: #f9fafb;">
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Negocio:</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${params.businessName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Tipo de Solicitud:</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: ${params.isRenewal ? '#b45309' : '#0284c7'};">${params.isRenewal ? "Renovación" : "Primera solicitud"}</td>
      </tr>
      <tr style="background-color: #f9fafb;">
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Tipo de Promoción:</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; color: #2563eb; font-weight: bold;">${label}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Monto Base:</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${params.baseAmount} USD</td>
      </tr>
      <tr style="background-color: #f9fafb;">
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Comisión Operativa:</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${params.feeAmount} USD</td>
      </tr>
      <tr style="background-color: #f0fdf4;">
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Total Pagado:</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; color: #166534; font-weight: bold;">${params.totalAmount} USDC</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Hash/Comprobante:</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-family: monospace; word-break: break-all;">${params.transactionHash}</td>
      </tr>
      <tr style="background-color: #f9fafb;">
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Usuario (Email):</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${params.userEmail}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Fecha Solicitud:</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })}</td>
      </tr>
    </table>
    <div style="text-align: center; margin-top: 25px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://mapeo-ve-app.vercel.app'}" style="display: inline-block; background-color: #0B3D91; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 15px;">
        Ver en el Panel de Administración
      </a>
    </div>
  `;

  const destinations = ["mapeove@gmail.com"];
  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    destinations.push(process.env.ADMIN_NOTIFICATION_EMAIL);
  }
  const uniqueDestinations = Array.from(new Set(destinations));

  const { getEmailLayout } = await import("./email-layout");

  return resend.emails.send({
    from: fromEmail,
    to: uniqueDestinations,
    subject: "Nueva solicitud de promoción en MapeoVE",
    html: getEmailLayout({ title: "Nueva solicitud de promoción", contentHtml: content }),
  });
}

