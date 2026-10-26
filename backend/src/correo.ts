import nodemailer from 'nodemailer';
import type { FastifyBaseLogger } from 'fastify';
import { config } from './config.js';

export const correoActivo = () => !!(config.smtp.host && config.smtp.remitente && config.appUrl);

const transporte = () => nodemailer.createTransport({
  host: config.smtp.host, port: config.smtp.puerto, secure: config.smtp.seguro,
  auth: config.smtp.usuario ? { user: config.smtp.usuario, pass: config.smtp.clave } : undefined,
});

const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

function plantilla(titulo: string, parrafos: string[], boton?: { texto: string; url: string }) {
  const cuerpo = parrafos.map((p) => `<p style="margin:0 0 14px;line-height:1.55">${p}</p>`).join('');
  const btn = boton ? `<p style="margin:22px 0"><a href="${escapar(boton.url)}" style="background:#059669;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;display:inline-block">${escapar(boton.texto)}</a></p>` : '';
  return `<div style="font-family:Arial,sans-serif;color:#1f2937;max-width:520px;margin:auto;padding:24px">
    <h2 style="color:#047857;margin:0 0 16px">🐾 ${escapar(titulo)}</h2>${cuerpo}${btn}
    <p style="font-size:12px;color:#6b7280;margin-top:28px">PATAS · Protección animal de Mosquera. Si no solicitaste esto, ignora este mensaje: tu cuenta sigue segura.</p></div>`;
}

export async function enviarCorreo(log: FastifyBaseLogger, para: string, asunto: string, titulo: string, parrafos: string[], boton?: { texto: string; url: string }) {
  if (!correoActivo()) return false;
  try {
    await transporte().sendMail({
      from: config.smtp.remitente, to: para, subject: asunto,
      html: plantilla(titulo, parrafos, boton),
      text: [titulo, ...parrafos.map((p) => p.replace(/<[^>]+>/g, '')), boton ? `${boton.texto}: ${boton.url}` : ''].join('\n\n'),
    });
    return true;
  } catch (e) {
    log.error({ err: e }, 'No se pudo enviar el correo');
    return false;
  }
}
export { escapar };
