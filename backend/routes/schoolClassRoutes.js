import { Router } from "express";

import {
  registerSchoolClass,
  getSchoolClasses
} from "../controllers/schoolClassController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

// Todas as rotas exigem autenticação
router.use(authenticateToken);

// Cadastrar turma: somente ADMIN
router.post(
  "/",
  authorizeRoles("ADMIN"),
  registerSchoolClass
);

// Consultar turmas: ADMIN, PROFESSOR e ALUNO
router.get(
  "/",
  authorizeRoles("ADMIN", "PROFESSOR", "ALUNO"),
  getSchoolClasses
);

export default router;