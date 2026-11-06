
import { Router } from "express";

import {
  registerScheduleEntry,
  getClassSchedule,
  getMySchedule,
  removeScheduleEntry
} from "../controllers/scheduleController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

//todas as rotas exigem autenticação
router.use(authenticateToken);

//agenda individual do aluno
router.get(
  "/my",
  authorizeRoles("ALUNO"),
  getMySchedule
);

//consultar horários de uma turma
router.get(
  "/class/:classId",
  authorizeRoles("ADMIN", "PROFESSOR"),
  getClassSchedule
);

//cadastrar horário
router.post(
  "/",
  authorizeRoles("ADMIN"),
  registerScheduleEntry
);

//excluir horário
router.delete(
  "/:id",
  authorizeRoles("ADMIN"),
  removeScheduleEntry
);

export default router;
