
import { Resend } from "resend";

export async function enviarEmail({
  destinatario,
  assunto,
  html,
  texto
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM não configurado.");
  }

  if (!destinatario || !assunto || !html) {
    throw new Error("Dados obrigatórios do e-mail não informados.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: [destinatario],
    subject: assunto,
    html,
    ...(texto ? { text: texto } : {})
  });

  if (error) {
    console.error("Erro retornado pelo serviço de e-mail:", error.message);
    throw new Error("Não foi possível enviar o e-mail.");
  }

  return data;
}
