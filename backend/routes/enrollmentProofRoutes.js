import { Router } from "express";

import {
  getMyEnrollmentProof
} from "../controllers/enrollmentProofController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authenticateToken);

// Cada aluno só pode emitir o próprio comprovante.
router.get(
  "/my",
  authorizeRoles("ALUNO"),
  getMyEnrollmentProof
);

export default router;