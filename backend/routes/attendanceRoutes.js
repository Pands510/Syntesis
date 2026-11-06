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

//consultar próprias frequências: somente aluno
router.get(
  "/my",
  authorizeRoles("ALUNO"),
  listMyAttendance
);

//consultar calendário: admin e professpr
router.get(
  "/:classId/dates",
  authorizeRoles("ADMIN", "PROFESSOR"),
  listAttendanceDates
);

//consultar alunos e frequências de uma data
router.get(
  "/:classId/date",
  authorizeRoles("ADMIN", "PROFESSOR"),
  listAttendanceByDate
);

//registrar frequência individual: somente professor
router.post(
  "/",
  authorizeRoles("PROFESSOR"),
  registerAttendance
);

//registrar frequências em lote: somente professor
router.post(
  "/batch",
  authorizeRoles("PROFESSOR"),
  registerAttendanceBatch
);

export default router;