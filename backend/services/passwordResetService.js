
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";

import prisma from "../database/prisma.js";
import { enviarEmail } from "./emailService.js";

function gerarHashToken(token) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function solicitarRecuperacaoSenha(email) {
  const emailNormalizado = email.trim().toLowerCase();

  const usuario = await prisma.user.findUnique({
    where: { email: emailNormalizado },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true
    }
  });

  // Não revela se o e-mail está cadastrado.
  if (!usuario || !usuario.isActive) {
    return;
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = gerarHashToken(token);

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const registro = await prisma.passwordResetToken.create({
    data: {
      userId: usuario.id,
      tokenHash,
      expiresAt
    }
  });

  try {
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL não configurada.");
    }

    const link = `${frontendUrl.replace(/\/+$/, "")}/redefinir-senha?token=${encodeURIComponent(token)}`;

    const nome = escaparHtml(usuario.name);

    await enviarEmail({
      destinatario: usuario.email,
      assunto: "Recuperação de senha - Syntesis",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
          <h2>Syntesis - Sistema de Educação</h2>

          <p>Olá, ${nome}!</p>

          <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>

          <p>Clique no botão abaixo para cadastrar uma nova senha:</p>

          <p style="margin: 32px 0;">
            <a
              href="${link}"
              style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px;"
            >
              Redefinir minha senha
            </a>
          </p>

          <p>Este link é válido por 30 minutos e pode ser utilizado apenas uma vez.</p>

          <p>Se você não solicitou a recuperação, ignore este e-mail.</p>

          <p>Atenciosamente,<br />Equipe Syntesis</p>
        </div>
      `,
      texto: `
Olá, ${usuario.name}!

Recebemos uma solicitação para redefinir sua senha.

Acesse o link abaixo para cadastrar uma nova senha:
${link}

O link expira em 30 minutos e pode ser utilizado apenas uma vez.

Se você não solicitou a recuperação, ignore este e-mail.

Equipe Syntesis.
      `
    });

    // Invalida os tokens anteriores somente após o envio bem-sucedido.
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: usuario.id,
        id: { not: registro.id }
      }
    });
  } catch (error) {
    // Se o envio falhar, remove o novo token.
    await prisma.passwordResetToken.deleteMany({
      where: { id: registro.id }
    });

    throw error;
  }
}

export async function redefinirSenha(token, novaSenha) {
  if (!token || typeof token !== "string") {
    const error = new Error("Link de recuperação inválido ou expirado.");
    error.statusCode = 400;
    throw error;
  }

  if (typeof novaSenha !== "string" || novaSenha.length < 8) {
    const error = new Error("A senha deve possuir pelo menos 8 caracteres.");
    error.statusCode = 400;
    throw error;
  }

  const tokenHash = gerarHashToken(token);
  const agora = new Date();

  const registro = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: agora }
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          passwordHash: true,
          isActive: true
        }
      }
    }
  });

  if (!registro || !registro.user.isActive) {
    const error = new Error("Link de recuperação inválido ou expirado.");
    error.statusCode = 400;
    throw error;
  }

  const mesmaSenha = await bcrypt.compare(
    novaSenha,
    registro.user.passwordHash
  );

  if (mesmaSenha) {
    const error = new Error("A nova senha deve ser diferente da senha atual.");
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(novaSenha, 12);

  await prisma.$transaction(async (tx) => {
    // Garante que o token ainda não foi utilizado ou expirou.
    const tokenAtualizado = await tx.passwordResetToken.updateMany({
      where: {
        id: registro.id,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      data: {
        usedAt: new Date()
      }
    });

    if (tokenAtualizado.count !== 1) {
      const error = new Error("Link de recuperação inválido ou expirado.");
      error.statusCode = 400;
      throw error;
    }

    await tx.user.update({
      where: { id: registro.userId },
      data: { passwordHash }
    });

    // Invalida qualquer outro token pendente desse usuário.
    await tx.passwordResetToken.updateMany({
      where: {
        userId: registro.userId,
        usedAt: null
      },
      data: {
        usedAt: new Date()
      }
    });
  });

  return true;
}
