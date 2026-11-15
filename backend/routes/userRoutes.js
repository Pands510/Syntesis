import { Router } from "express";

import {
  registerStudent,
  getMyStudentProfile,
  getMyStudentEnrollments,
  getMyProfessorProfile
} from "../controllers/userController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

// Cadastro público de alunos
router.post("/register", registerStudent);

// Consulta do perfil do próprio aluno
router.get(
  "/me",
  authenticateToken,
  authorizeRoles("ALUNO"),
  getMyStudentProfile
);

// Consulta das matrículas do próprio aluno
router.get(
  "/me/enrollments",
  authenticateToken,
  authorizeRoles("ALUNO"),
  getMyStudentEnrollments
);

// Consulta do perfil do próprio professor
router.get(
  "/professor/me",
  authenticateToken,
  authorizeRoles("PROFESSOR"),
  getMyProfessorProfile
);

export default router;