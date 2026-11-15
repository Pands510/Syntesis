import { Router } from "express";
import loginRateLimit from "../middlewares/loginRateLimit.js";

import {
  login,
  changePassword,
  changeEmail,
  requestPasswordReset,
  resetPassword
} from "../controllers/authController.js";

import { authenticateToken } from "../middlewares/authMiddleware.js";
import passwordResetRateLimit from "../middlewares/passwordResetRateLimit.js";

const router = Router();

router.post("/forgot-password", passwordResetRateLimit, requestPasswordReset);

router.post("/reset-password", passwordResetRateLimit, resetPassword);

// Autenticação
router.post("/login", loginRateLimit, login);

// Consulta do usuário autenticado
router.get("/me", authenticateToken, (req, res) => {
  return res.status(200).json({
    mensagem: "Você está autenticado!",
    usuario: req.user
  });
});

// Alteração da senha do próprio usuário
router.patch("/change-password", authenticateToken, changePassword);

// Alteração do e-mail do próprio usuário
router.patch("/change-email", authenticateToken, changeEmail);

export default router;
