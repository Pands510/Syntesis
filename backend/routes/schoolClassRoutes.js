import { Router } from "express";

import {
  registerSchoolClass,
  getSchoolClasses
} from "../controllers/schoolClassController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

//todas as rotas exigem autenticação
router.use(authenticateToken);

//cadastrar turma: somente ADMIN
router.post(
  "/",
  authorizeRoles("ADMIN"),
  registerSchoolClass
);

//consultar turmas: ADMIN, PROFESSOR e ALUNO
router.get(
  "/",
  authorizeRoles("ADMIN", "PROFESSOR", "ALUNO"),
  getSchoolClasses
);

export default router;