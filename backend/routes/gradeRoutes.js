import { Router } from "express";

import {
  createGrade,
  createGradesBatch,
  createFinalExamGradesBatch,
  listGrades,
  updateGrade,
  getStudentReport
} from "../controllers/gradeController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

//todas as rotas exigem autenticação
router.use(authenticateToken);

router.get(
  "/student/report",
  authorizeRoles("ALUNO"),
  getStudentReport
);

//consultar notas: ADMIN, PROFESSOR e ALUNO
router.get(
  "/:classId",
  authorizeRoles("ADMIN", "PROFESSOR", "ALUNO"),
  listGrades
);

//lançar nota individual: somente PROFESSOR
router.post(
  "/",
  authorizeRoles("PROFESSOR"),
  createGrade
);

//lançar várias notas de uma vez: somente PROFESSOR
router.post(
  "/batch",
  authorizeRoles("PROFESSOR"),
  createGradesBatch
);

//lançar ou atualizar notas da prova final em lote: somente PROFESSOR
router.post(
  "/final",
  authorizeRoles("PROFESSOR"),
  createFinalExamGradesBatch
);

//atualizar nota individual: somente PROFESSOR
router.put(
  "/:id",
  authorizeRoles("PROFESSOR"),
  updateGrade
);

export default router;