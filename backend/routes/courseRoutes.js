
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

//todas as rotas exigem autenticação e perfil admin
router.use(authenticateToken, authorizeRoles("ADMIN"));

//listar cursos
router.get("/", getCourses);

//cadastrar curso
router.post("/", registerCourse);

//editar curso
router.put("/:id", updateCourse);

//excluir curso
router.delete("/:id", deleteCourse);

//vincular aluno a um curso
router.post("/enroll-student", enrollStudentInCourse);

export default router;
