import { getEmailLayout } from "../email-layout";

interface ResetPasswordEmailProps {
  identifier: string; // name or email
  resetUrl: string;
}

export function getResetPasswordEmailHtml({ identifier, resetUrl }: ResetPasswordEmailProps): string {
  const title = "Restablece tu contraseña de MapeoVE";

  const contentHtml = `
    <h2 style="color: #0B3D91; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: bold;">Hola, ${identifier}</h2>
    <p style="margin-top: 0; margin-bottom: 20px;">
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>MapeoVE</strong>.
    </p>
    <p style="margin-bottom: 25px;">
      Para continuar y elegir una nueva contraseña, haz clic en el siguiente botón:
    </p>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${resetUrl}" target="_blank" style="background-color: #0B3D91; color: #ffffff !important; display: inline-block; padding: 12px 30px; font-size: 14px; font-weight: bold; text-decoration: none !important; border-radius: 8px; box-shadow: 0 4px 6px rgba(11, 61, 145, 0.15); text-align: center;">
        Restablecer contraseña
      </a>
    </div>

    <div style="background-color: #fff9e6; border-left: 4px solid #F4C430; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0; font-size: 13px; color: #7d6608;">
      <strong>Nota importante:</strong> Este enlace caducará en <strong>1 hora</strong> por motivos de seguridad. Si el enlace vence, deberás solicitar uno nuevo desde la pantalla de inicio de sesión.
    </div>

    <p style="margin-bottom: 0; font-size: 13px; color: #7f8c8d; line-height: 1.5;">
      <strong>¿No solicitaste este cambio?</strong> Si no has sido tú quien solicitó restablecer la contraseña, no te preocupes: tu cuenta sigue estando segura. Puedes ignorar o eliminar este correo sin realizar ninguna acción.
    </p>
  `;

  return getEmailLayout({
    title,
    preheader: "Instrucciones para restablecer la contraseña de tu cuenta de MapeoVE.",
    contentHtml,
  });
}
