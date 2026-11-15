import { Router } from "express";

import {
  create,
  listAuthored,
  listReceived,
  update,
  remove,
  markAsRead
} from "../controllers/announcementController.js";

import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authenticateToken);

// Comunicados recebidos pelo aluno
router.get(
  "/received",
  authorizeRoles("ALUNO"),
  listReceived
);

// Marcar comunicado como lido
router.patch(
  "/:id/read",
  authorizeRoles("ALUNO"),
  markAsRead
);

// Gerenciamento de comunicados
router.get(
  "/",
  authorizeRoles("ADMIN", "PROFESSOR"),
  listAuthored
);

router.post(
  "/",
  authorizeRoles("ADMIN", "PROFESSOR"),
  create
);

router.put(
  "/:id",
  authorizeRoles("ADMIN", "PROFESSOR"),
  update
);

router.delete(
  "/:id",
  authorizeRoles("ADMIN", "PROFESSOR"),
  remove
);

export default router;
