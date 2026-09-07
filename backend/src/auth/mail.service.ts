import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  async enviarEnlaceRestablecimiento(correo: string, enlace: string) {
    const host = process.env.MAIL_HOST;
    const port = Number(process.env.MAIL_PORT ?? 587);
    const user = process.env.MAIL_USER;
    const password = process.env.MAIL_PASSWORD;
    const from = process.env.MAIL_FROM ?? user;

    if (!host || !user || !password || !from) {
      throw new ServiceUnavailableException(
        'El servicio de correo no está configurado',
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.MAIL_SECURE === 'true',
      auth: { user, pass: password },
    });

    await transporter.sendMail({
      from,
      to: correo,
      subject: 'Restablece tu contraseña de BañosTour',
      text: `Solicitaste restablecer tu contraseña. Abre este enlace dentro de 15 minutos: ${enlace}\n\nSi no fuiste tú, ignora este mensaje.`,
      html: `<p>Solicitaste restablecer tu contraseña de BañosTour.</p><p><a href="${enlace}">Restablecer contraseña</a></p><p>Este enlace vence en 15 minutos y solo puede utilizarse una vez.</p><p>Si no fuiste tú, ignora este mensaje.</p>`,
    });
  }
}
