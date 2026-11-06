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

//todas as rotas exigem autenticação
router.use(authenticateToken);

//matricular aluno: somente ADMIN
router.post(
  "/",
  authorizeRoles("ADMIN"),
  registerEnrollment
);

//consultar matrículas: ADMIN, PROFESSOR e ALUNO
router.get(
  "/",
  authorizeRoles("ADMIN", "PROFESSOR", "ALUNO"),
  getEnrollments
);

//alterar status: somente ADMIN
router.patch(
  "/:id/status",
  authorizeRoles("ADMIN"),
  changeEnrollmentStatus
);

export default router;