
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../database/prisma.js";

async function createAdmin() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  //confere se as variáveis foram configuradas
  if (!name || !email || !password) {
    throw new Error(
      "Configure ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD no arquivo .env."
    );
  }

  if (password.length < 12) {
    throw new Error(
      "A senha do administrador deve possuir pelo menos 12 caracteres."
    );
  }

  //verifica se o e-mail já está cadastrado
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    if (existingUser.role === "ADMIN") {
      console.log("A conta de administrador já existe.");
      return;
    }

    throw new Error(
      "Este e-mail já pertence a outro perfil. Escolha outro ADMIN_EMAIL."
    );
  }

  //criptografa a senha
  const passwordHash = await bcrypt.hash(password, 12);

  //cria a conta de administrador
  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN"
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  console.log("Administrador criado com sucesso!");
  console.log(admin);
}

createAdmin()
  .catch((error) => {
    console.error("Erro ao criar administrador:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
