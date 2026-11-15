
import "dotenv/config";
import { enviarEmail } from "../services/emailService.js";

async function testarEmail() {
  const destinatario = process.argv[2];

  if (!destinatario) {
    throw new Error("Informe o e-mail de destino como argumento.");
  }

  const resultado = await enviarEmail({
    destinatario,
    assunto: "Teste de envio - Syntesis",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>Syntesis - Sistema de Educação</h2>
        <p>Este é um teste de envio de e-mail.</p>
        <p>Se você recebeu esta mensagem, a integração com o Resend está funcionando!</p>
      </div>
    `,
    texto: "Teste de envio do Syntesis. A integração com o Resend está funcionando!"
  });

  console.log("E-mail enviado com sucesso!");
  console.log("Identificador:", resultado.id);
}

testarEmail().catch((error) => {
  console.error("Falha no teste:", error.message);
  process.exitCode = 1;
});
