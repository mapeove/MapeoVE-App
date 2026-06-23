import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { sendPromotionExpiryReminderEmail } from "@/lib/email";

export async function GET(req: Request) {
  try {
    // Protect endpoint with CRON_SECRET
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 3);

    // Find active promotions that expire in less than or equal to 3 days and haven't been reminded
    const expiringPromotions = await prisma.promotionRequest.findMany({
      where: {
        status: "APPROVED",
        expiresAt: {
          lte: targetDate,
          gt: today // Has not expired yet
        },
        reminderSentAt: null,
      },
      include: {
        business: true,
        user: true,
      }
    });

    const results = [];

    for (const promo of expiringPromotions) {
      if (promo.user?.email && promo.startsAt && promo.expiresAt) {
        try {
          await sendPromotionExpiryReminderEmail(
            promo.user.email,
            promo.business.name,
            promo.type,
            promo.startsAt,
            promo.expiresAt
          );

          await prisma.promotionRequest.update({
            where: { id: promo.id },
            data: { reminderSentAt: new Date() },
          });

          results.push({ id: promo.id, business: promo.business.name, status: 'sent' });
        } catch (emailError) {
          console.error(`Failed to send reminder for ${promo.id}:`, emailError);
          results.push({ id: promo.id, business: promo.business.name, status: 'error' });
        }
      }
    }

    return NextResponse.json({ success: true, processed: results.length, details: results });
  } catch (error) {
    console.error("Error processing expiry reminders:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
