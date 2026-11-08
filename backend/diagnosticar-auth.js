import "dotenv/config";
import prisma from "./database/prisma.js";
import bcrypt from "bcryptjs";

const email = "admin@syntesis.com";
const password = "SUA_SENHA_ADMIN";

const user = await prisma.user.findUnique({
  where: { email: email.trim().toLowerCase() }
});

console.log("1. Usuário encontrado:", Boolean(user));

if (user) {
  console.log("2. Conta ativa:", user.isActive);
  console.log(
    "3. Senha válida:",
    await bcrypt.compare(password, user.passwordHash)
  );
}

await prisma.$disconnect();
