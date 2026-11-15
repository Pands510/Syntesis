import "dotenv/config";
import prisma from "./database/prisma.js";
import bcrypt from "bcryptjs";

const user = await prisma.user.findUnique({
  where: { email: "admin@syntesis.com" },
  select: { passwordHash: true }
});

const senha = "12345678";
const resultado = await bcrypt.compare(senha, user.passwordHash);

console.log("Senha confere:", resultado);

await prisma.$disconnect();
