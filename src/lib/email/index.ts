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
