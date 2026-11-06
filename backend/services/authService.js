//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";
import bcrypt from "bcryptjs";

export async function authenticateUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  });

  // Não revela se o e-mail existe ou não
  if (!user || !user.isActive) {
    return null;
  }

  const passwordIsValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordIsValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export async function changeUserPassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true
    }
  });

  if (!user) {
    const error = new Error("Usuário não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  const passwordIsValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!passwordIsValid) {
    const error = new Error("A senha atual está incorreta.");
    error.statusCode = 400;
    throw error;
  }

  const samePassword = await bcrypt.compare(
    newPassword,
    user.passwordHash
  );

  if (samePassword) {
    const error = new Error(
      "A nova senha deve ser diferente da senha atual."
    );
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });

  return true;
}
