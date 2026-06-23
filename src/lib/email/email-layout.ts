interface LayoutProps {
  title: string;
  preheader?: string;
  contentHtml: string;
}

export function getEmailLayout({ title, preheader = "", contentHtml }: LayoutProps): string {
  const currentYear = new Date().getFullYear();
  
  // Use Vercel deployment domain or custom domain for logo asset
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mapeo-ve-app.vercel.app";
  const logoUrl = `${appUrl}/mapeove-logo.png`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #f4f6f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    table {
      border-collapse: collapse !important;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f6f9;
      padding: 40px 0;
    }
    .main-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      border: 1px solid #e1e4e8;
    }
    .header {
      background-color: #0B3D91;
      padding: 30px 20px;
      text-align: center;
      border-bottom: 4px solid #F4C430;
    }
    .logo {
      height: 48px;
      width: auto;
      max-width: 180px;
      display: inline-block;
    }
    .content {
      padding: 40px 30px;
      color: #2c3e50;
      font-size: 15px;
      line-height: 1.6;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 30px;
      text-align: center;
      font-size: 12px;
      color: #7f8c8d;
      border-top: 1px solid #edf2f7;
    }
    .footer a {
      color: #0B3D91;
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .main-container {
        width: 100% !important;
        border-radius: 0 !important;
        border-left: 0 !important;
        border-right: 0 !important;
      }
      .content {
        padding: 30px 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f4f6f9;">
  ${preheader ? `<span style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; color: #f4f6f9;">${preheader}</span>` : ""}
  <table role="presentation" width="100%" class="wrapper" style="background-color: #f4f6f9; padding: 40px 0; width: 100%;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" class="main-container" style="background-color: #ffffff; border-radius: 12px; max-width: 600px; border: 1px solid #e1e4e8;">
          <!-- Header -->
          <tr>
            <td class="header" style="background-color: #0B3D91; padding: 30px 20px; text-align: center; border-bottom: 4px solid #F4C430;">
              <a href="https://mapeove.com" target="_blank" style="text-decoration: none;">
                <img src="${logoUrl}" alt="MapeoVE" style="height: 48px; border: 0;" />
              </a>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px 30px; color: #2c3e50; font-size: 15px; line-height: 1.6;">
              ${contentHtml}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer" style="background-color: #f8fafc; padding: 24px 30px; text-align: center; font-size: 12px; color: #7f8c8d; border-top: 1px solid #edf2f7;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c3e50;">MapeoVE — Plataforma de Geolocalización de Comercios</p>
              <p style="margin: 0 0 15px 0;">Conectando negocios locales de Venezuela con el mundo.</p>
              <p style="margin: 0 0 15px 0;">Visítanos en <a href="https://mapeove.com" target="_blank" style="color: #0B3D91; text-decoration: underline;">mapeove.com</a></p>
              <p style="margin: 0; font-size: 11px; color: #95a5a6; line-height: 1.4;">
                Si no solicitaste este correo, puedes ignorarlo con total seguridad.<br>
                MapeoVE © ${currentYear}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
