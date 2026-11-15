import "dotenv/config";
import prisma from "./database/prisma.js";
import bcrypt from "bcryptjs";
import { authenticateUser } from "./services/authService.js";

const email = "admin@syntesis.com";
const password = "12345678";

const user = await prisma.user.findUnique({
  where: { email }
});

const comparacao = await bcrypt.compare(password, user.passwordHash);
const autenticacao = await authenticateUser(email, password);

console.log("Comparação direta:", comparacao);
console.log("Autenticação pelo serviço:", Boolean(autenticacao));

await prisma.$disconnect();
