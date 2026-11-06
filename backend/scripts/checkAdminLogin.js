
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../database/prisma.js";

async function checkAdminLogin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("ADMIN_EMAIL ou ADMIN_PASSWORD não configurado.");
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      role: true,
      isActive: true,
      passwordHash: true//trazendo o hash para a conferência matemática do Bcrypt
    }
  });

  if (!user) {
    console.log("Resultado: administrador não encontrado no banco.");
    return;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  console.log("\nDiagnóstico da conta:");
  console.log("E-mail encontrado:", true);
  console.log("Perfil:", user.role);
  console.log("Conta ativa:", user.isActive);
  console.log("Senha do .env corresponde ao banco:", passwordMatches);
}

checkAdminLogin()
  .catch((error) => {
    console.error("Erro no diagnóstico:", error.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
