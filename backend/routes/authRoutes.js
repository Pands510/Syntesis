import { Router } from "express";
import loginRateLimit from "../middlewares/loginRateLimit.js";

import {
  login,
  changePassword
} from "../controllers/authController.js";

import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = Router();

//autenticação
router.post("/login", loginRateLimit, login);

//consulta do usuário autenticado
router.get("/me", authenticateToken, (req, res) => {
  return res.status(200).json({
    mensagem: "Você está autenticado!",
    usuario: req.user
  });
});

//alteração da senha do próprio usuário
router.patch("/change-password", authenticateToken, changePassword);

export default router;
