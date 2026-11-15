import { Router } from "express";

import {
  registerDiscipline,
  getDisciplines,
  editDiscipline,
  removeDiscipline
} from "../controllers/disciplineController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

// Todas as rotas exigem autenticação
router.use(authenticateToken);

// Consultar disciplinas: todos os perfis autenticados
router.get(
  "/",
  authorizeRoles("ADMIN", "PROFESSOR", "ALUNO"),
  getDisciplines
);

// Cadastrar disciplina: somente ADMIN
router.post(
  "/",
  authorizeRoles("ADMIN"),
  registerDiscipline
);

// Editar disciplina: somente ADMIN
router.put(
  "/:id",
  authorizeRoles("ADMIN"),
  editDiscipline
);

// Excluir disciplina: somente ADMIN
router.delete(
  "/:id",
  authorizeRoles("ADMIN"),
  removeDiscipline
);

export default router;