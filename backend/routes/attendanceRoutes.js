import { Router } from "express";

import {
  listAttendanceDates,
  listAttendanceByDate,
  registerAttendance,
  registerAttendanceBatch,
  listMyAttendance
} from "../controllers/attendanceController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authenticateToken);

// Consultar próprias frequências: somente ALUNO
router.get(
  "/my",
  authorizeRoles("ALUNO"),
  listMyAttendance
);

// Consultar calendário: ADMIN e PROFESSOR
router.get(
  "/:classId/dates",
  authorizeRoles("ADMIN", "PROFESSOR"),
  listAttendanceDates
);

// Consultar alunos e frequências de uma data
router.get(
  "/:classId/date",
  authorizeRoles("ADMIN", "PROFESSOR"),
  listAttendanceByDate
);

// Registrar frequência individual: somente PROFESSOR
router.post(
  "/",
  authorizeRoles("PROFESSOR"),
  registerAttendance
);

// Registrar frequências em lote: somente PROFESSOR
router.post(
  "/batch",
  authorizeRoles("PROFESSOR"),
  registerAttendanceBatch
);

export default router;