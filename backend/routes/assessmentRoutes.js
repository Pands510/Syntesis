
import { Router } from "express";

import {
  createAssessment,
  listAssessments,
  updateAssessment,
  deleteAssessment
} from "../controllers/assessmentController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

// Todas as rotas exigem autenticação
router.use(authenticateToken);

// Cadastrar avaliação: somente PROFESSOR
router.post(
  "/",
  authorizeRoles("PROFESSOR"),
  createAssessment
);

// Consultar avaliações: ADMIN, PROFESSOR e ALUNO
router.get(
  "/:classId",
  authorizeRoles("ADMIN", "PROFESSOR", "ALUNO"),
  listAssessments
);

// Editar avaliação: somente PROFESSOR
router.put(
  "/:id",
  authorizeRoles("PROFESSOR"),
  updateAssessment
);

// Excluir avaliação: somente PROFESSOR
router.delete(
  "/:id",
  authorizeRoles("PROFESSOR"),
  deleteAssessment
);

export default router;
