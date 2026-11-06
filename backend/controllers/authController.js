import jwt from "jsonwebtoken";
import {
  authenticateUser,
  changeUserPassword
} from "../services/authService.js";

//verificação padrão mixuruca
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
