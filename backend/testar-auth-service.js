import "dotenv/config";
import { authenticateUser } from "./services/authService.js";

const email = "admin@syntesis.com";
const password = "SUA_SENHA_ADMIN";

const user = await authenticateUser(email, password);

console.log("Autenticação pelo serviço:", user ? "SUCESSO" : "FALHOU");

if (user) {
  console.log({
    nome: user.name,
    email: user.email,
    perfil: user.role
  });
}
