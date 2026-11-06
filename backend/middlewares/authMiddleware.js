
import jwt from "jsonwebtoken";
import prisma from "../database/prisma.js";

export async function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      mensagem: "Acesso não autorizado. Faça login."
    });
  }

  const token = authorization.split(" ")[1];

  try {
    //decodificando o token com o algoritmo travado em HS256 pra evitar ataques de token "None".
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"]
    });

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        mensagem: "Conta inexistente ou desativada."
      });
    }

    // Utiliza o perfil atual do banco, não o perfil antigo do token
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();//vai com Deus para o controller

  } catch (error) {
    if (error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError") {
      return res.status(401).json({
        mensagem: "Token inválido ou expirado."
      });
    }

    console.error("Erro na autenticação:", error);

    return res.status(500).json({
      mensagem: "Erro ao verificar autenticação."
    });
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        mensagem: "Você não possui permissão para acessar este recurso."
      });
    }

    next();
  };
}
