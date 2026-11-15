import { Router } from "express";

import {
  registerEnrollment,
  getEnrollments,
  changeEnrollmentStatus
} from "../controllers/enrollmentController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

// Todas as rotas exigem autenticação
router.use(authenticateToken);

// Matricular aluno: somente ADMIN
router.post(
  "/",
  authorizeRoles("ADMIN"),
  registerEnrollment
);

// Consultar matrículas: ADMIN, PROFESSOR e ALUNO
router.get(
  "/",
  authorizeRoles("ADMIN", "PROFESSOR", "ALUNO"),
  getEnrollments
);

// Alterar status: somente ADMIN
router.patch(
  "/:id/status",
  authorizeRoles("ADMIN"),
  changeEnrollmentStatus
);

export default router;