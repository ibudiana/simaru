import nodemailer from 'nodemailer';

let transporter: any;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}


interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: MailOptions) {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}


export function getEmailTemplate(title: string, message: string, actionLink?: string, actionText?: string) {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .header {
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                padding: 32px;
                text-align: center;
            }
            .header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                letter-spacing: -0.025em;
            }
            .content {
                padding: 40px;
                color: #334155;
                line-height: 1.6;
            }
            .content h2 {
                color: #1e293b;
                font-size: 20px;
                font-weight: 600;
                margin-top: 0;
            }
            .content p {
                margin-bottom: 24px;
                font-size: 16px;
            }
            .button-container {
                text-align: center;
                margin-top: 32px;
            }
            .button {
                display: inline-block;
                background-color: #2563eb;
                color: #ffffff !important;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                transition: background-color 0.2s;
            }
            .footer {
                padding: 24px;
                text-align: center;
                background-color: #f1f5f9;
                color: #64748b;
                font-size: 14px;
            }
            .footer p {
                margin: 0;
            }
            .divider {
                height: 1px;
                background-color: #e2e8f0;
                margin: 32px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SIMARU</h1>
            </div>
            <div class="content">
                <h2>${title}</h2>
                <p>${message}</p>
                ${actionLink ? `
                <div class="button-container">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${actionLink}" class="button">${actionText || 'Lihat Detail'}</a>
                </div>
                ` : ''}
                <div class="divider"></div>
                <p style="font-size: 14px; color: #94a3b8;">Ini adalah email otomatis. Harap jangan membalas email ini.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} SIMARU - Sistem Manajemen Ruangan</p>
                <p>Universitas Ciputra</p>
            </div>
        </div>
    </body>
    </html>
  `;
}
