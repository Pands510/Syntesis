
import { Router } from "express";

import {
  registerCourse,
  enrollStudentInCourse,
  getCourses,
  updateCourse,
  deleteCourse
} from "../controllers/courseController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

// Todas as rotas exigem autenticação e perfil ADMIN
router.use(authenticateToken, authorizeRoles("ADMIN"));

// Listar cursos
router.get("/", getCourses);

// Cadastrar curso
router.post("/", registerCourse);

// Editar curso
router.put("/:id", updateCourse);

// Excluir curso
router.delete("/:id", deleteCourse);

// Vincular aluno a um curso
router.post("/enroll-student", enrollStudentInCourse);

export default router;
