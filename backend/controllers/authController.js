
import jwt from "jsonwebtoken";

import {
  authenticateUser,
  changeUserPassword,
  changeUserEmail
} from "../services/authService.js";

import {
  solicitarRecuperacaoSenha,
  redefinirSenha
} from "../services/passwordResetService.js";


export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        mensagem: "Informe o e-mail e a senha."
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET não configurado no ambiente.");

      return res.status(500).json({
        mensagem: "Erro de configuração do servidor."
      });
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return res.status(401).json({
        mensagem: "E-mail ou senha incorretos."
      });
    }

    const token = jwt.sign(
      {
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        subject: user.id,
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        algorithm: "HS256"
      }
    );

    return res.status(200).json({
      mensagem: "Login realizado com sucesso!",
      token,
      usuario: user
    });

  } catch (error) {
    console.error("Erro no login:", error);

    return res.status(500).json({
      mensagem: "Erro interno ao realizar login."
    });
  }
}


export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        mensagem: "Informe a senha atual e a nova senha."
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        mensagem: "A nova senha deve possuir pelo menos 8 caracteres."
      });
    }

    await changeUserPassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    return res.status(200).json({
      mensagem: "Senha alterada com sucesso!"
    });

  } catch (error) {
    console.error("Erro ao alterar senha:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        mensagem: error.message
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno ao alterar a senha."
    });
  }
}


export async function changeEmail(req, res) {
  try {
    const { currentPassword, newEmail } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newEmail !== "string" ||
      !currentPassword ||
      !newEmail.trim()
    ) {
      return res.status(400).json({
        mensagem: "Informe a senha atual e o novo e-mail."
      });
    }

    const normalizedEmail = newEmail.trim().toLowerCase();

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizedEmail
    );

    if (!emailIsValid) {
      return res.status(400).json({
        mensagem: "Informe um endereço de e-mail válido."
      });
    }

    await changeUserEmail(
      req.user.id,
      currentPassword,
      normalizedEmail
    );

    return res.status(200).json({
      mensagem: "E-mail alterado com sucesso!",
      email: normalizedEmail
    });

  } catch (error) {
    console.error("Erro ao alterar e-mail:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        mensagem: error.message
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno ao alterar o e-mail."
    });
  }
}


// Solicitar recuperação de senha
export async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        mensagem: "Informe seu endereço de e-mail."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizedEmail
    );

    if (!emailIsValid) {
      return res.status(400).json({
        mensagem: "Informe um endereço de e-mail válido."
      });
    }

    await solicitarRecuperacaoSenha(normalizedEmail);

    return res.status(200).json({
      mensagem: "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha."
    });

  } catch (error) {
    console.error("Erro ao solicitar recuperação de senha:", error.message);

    return res.status(500).json({
      mensagem: "Não foi possível processar sua solicitação no momento. Tente novamente mais tarde."
    });
  }
}


// Redefinir senha utilizando o token
export async function resetPassword(req, res) {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (
      typeof token !== "string" ||
      !token ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        mensagem: "Informe o token, a nova senha e a confirmação."
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        mensagem: "A senha deve possuir pelo menos 8 caracteres."
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        mensagem: "A confirmação da senha não corresponde."
      });
    }

    await redefinirSenha(token, newPassword);

    return res.status(200).json({
      mensagem: "Senha redefinida com sucesso! Você já pode entrar no sistema."
    });

  } catch (error) {
    console.error("Erro ao redefinir senha:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        mensagem: error.message
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno ao redefinir a senha."
    });
  }
}
