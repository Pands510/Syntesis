
import { Router } from "express";

import {
  registerAcademicTerm,
  getAcademicTerms,
  getAcademicTermById,
  editAcademicTerm,
  activateAcademicTerm,
  finishAcademicTerm,
  removeAcademicTerm
} from "../controllers/academicTermController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles("ADMIN"));

router.post("/", registerAcademicTerm);
router.get("/", getAcademicTerms);
router.get("/:id", getAcademicTermById);
router.patch("/:id", editAcademicTerm);
router.patch("/:id/iniciar", activateAcademicTerm);
router.patch("/:id/encerrar", finishAcademicTerm);
router.delete("/:id", removeAcademicTerm);

export default router;
