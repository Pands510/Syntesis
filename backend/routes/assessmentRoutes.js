
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

//todas as rotas exigem autenticação
router.use(authenticateToken);

//cadastrar avaliação: somente professsor
router.post(
  "/",
  authorizeRoles("PROFESSOR"),
  createAssessment
);

//consultar avaliações: adm, professor e aluno
router.get(
  "/:classId",
  authorizeRoles("ADMIN", "PROFESSOR", "ALUNO"),
  listAssessments
);

//editar avaliação: somente professro
router.put(
  "/:id",
  authorizeRoles("PROFESSOR"),
  updateAssessment
);

//excluir avaliação: somente professor
router.delete(
  "/:id",
  authorizeRoles("PROFESSOR"),
  deleteAssessment
);

export default router;
