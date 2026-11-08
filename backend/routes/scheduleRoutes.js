import { Router } from "express";

import {
  registerScheduleEntry,
  getClassSchedule,
  getMySchedule,
  getAllSchedules,
  getProfessorMySchedule,
  removeScheduleEntry
} from "../controllers/scheduleController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authenticateToken);

// Quadro geral do administrador
router.get(
  "/all",
  authorizeRoles("ADMIN"),
  getAllSchedules
);

// Agenda individual do aluno
router.get(
  "/my",
  authorizeRoles("ALUNO"),
  getMySchedule
);

// Agenda individual do professor
router.get(
  "/professor/my",
  authorizeRoles("PROFESSOR"),
  getProfessorMySchedule
);

// Consultar horários de uma turma
router.get(
  "/class/:classId",
  authorizeRoles("ADMIN", "PROFESSOR"),
  getClassSchedule
);

// Cadastrar horário
router.post(
  "/",
  authorizeRoles("ADMIN"),
  registerScheduleEntry
);

// Excluir horário
router.delete(
  "/:id",
  authorizeRoles("ADMIN"),
  removeScheduleEntry
);

export default router;