import { Router } from "express";

import {
  registerStudent,
  getMyStudentProfile,
  getMyStudentEnrollments
} from "../controllers/userController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

//cadastro público de alunos
router.post("/register", registerStudent);

//consulta do perfil do próprio aluno
router.get(
  "/me",
  authenticateToken,
  authorizeRoles("ALUNO"),
  getMyStudentProfile
);

//consulta das matrículas do próprio aluno
router.get(
  "/me/enrollments",
  authenticateToken,
  authorizeRoles("ALUNO"),
  getMyStudentEnrollments
);

export default router;