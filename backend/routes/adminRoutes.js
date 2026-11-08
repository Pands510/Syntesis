
import { Router } from "express";

import {
  registerProfessor,
  getProfessors,
  editProfessor
} from "../controllers/professorController.js";

import {
  getUsers,
  getStudents,
  changeUserStatus,
  getStats
} from "../controllers/adminController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

import {
  registerStudent,
  editStudent,
  changeStudentStatus
} from "../controllers/studentController.js";

const router = Router();

// Todas estas rotas exigem perfil de administrador
router.use(authenticateToken, authorizeRoles("ADMIN"));

// Indicadores do painel administrativo
router.get("/stats", getStats);

// Cadastrar professor
router.post("/professors", registerProfessor);

// Editar professor
router.put("/professors/:id", editProfessor);

// Registrar alunos
router.post("/students", registerStudent);

// Editar alunos
router.put("/students/:id", editStudent);

router.patch("/students/:id/status", changeStudentStatus);

// Listar professores ativos
router.get("/professors", getProfessors);

// Listar usuários
router.get("/users", getUsers);

// Ativar ou desativar usuário
router.patch("/users/:id/status", changeUserStatus);

// Listar alunos com informações acadêmicas
router.get("/students", getStudents);

export default router;
