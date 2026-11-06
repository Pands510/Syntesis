
import { Router } from "express";

import {
  registerProfessor,
  getProfessors,
  editProfessor
} from "../controllers/professorController.js";

import {
  getUsers,
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
} from "../controllers/studentController.js"; //apesar de mostrar q tem erro, tá funcionando, vai saber

const router = Router();

//todas as rotas embaixo exigem perfil de administrador
router.use(authenticateToken, authorizeRoles("ADMIN"));

//indicadores do painel administrativo
router.get("/stats", getStats);

//cadastrar professor
router.post("/professors", registerProfessor);

//editar professor
router.put("/professors/:id", editProfessor);

//registrar alunos
router.post("/students", registerStudent);

//editar alunos
router.put("/students/:id", editStudent);

router.patch("/students/:id/status", changeStudentStatus);

//listar professores ativos
router.get("/professors", getProfessors);

//listar usuários
router.get("/users", getUsers);

//ativar ou desativar usuário
router.patch("/users/:id/status", changeUserStatus);

export default router;
