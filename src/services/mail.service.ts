import nodemailer from 'nodemailer';

function mailConfiguration() {
  const host = process.env.MAIL_HOST?.trim();
  const port = Number(process.env.MAIL_PORT || 0);
  const user = process.env.MAIL_USER?.trim();
  const password = process.env.MAIL_PASSWORD;
  const from = process.env.MAIL_FROM?.trim();
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !password || !from) return null;
  return { host, port, user, password, from, secure: process.env.MAIL_SECURE === 'true' };
}

export function isMailConfigured(): boolean {
  return mailConfiguration() !== null;
}

export async function sendRecoveryCode(recipient: string, code: string): Promise<void> {
  const config = mailConfiguration();
  if (!config) throw new Error('Servicio de correo no configurado');
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  await transport.sendMail({
    from: config.from,
    to: recipient,
    subject: 'Código de recuperación de BañosTour',
    text: `Tu código de recuperación es ${code}. Expira en 15 minutos. Si no solicitaste este cambio, ignora el mensaje.`,
    html: `<p>Tu código de recuperación de BañosTour es:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>Expira en 15 minutos. Si no solicitaste este cambio, ignora el mensaje.</p>`,
  });
}
