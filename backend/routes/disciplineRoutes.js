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

//todas as rotas exigem autenticação
router.use(authenticateToken);

//consultar disciplinas: todos os perfis autenticados
router.get(
  "/",
  authorizeRoles("ADMIN", "PROFESSOR", "ALUNO"),
  getDisciplines
);

//cadastrar disciplina: somente ADMIN
router.post(
  "/",
  authorizeRoles("ADMIN"),
  registerDiscipline
);

//editar disciplina: somente ADMIN
router.put(
  "/:id",
  authorizeRoles("ADMIN"),
  editDiscipline
);

//excluir disciplina: somente ADMIN
router.delete(
  "/:id",
  authorizeRoles("ADMIN"),
  removeDiscipline
);

export default router;