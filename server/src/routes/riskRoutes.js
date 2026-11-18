
import { Router } from "express";

import {
  listRisks,
  createRisk,
  updateRisk,
  deleteRisk
} from "../controllers/riskController.js";

import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/:projectId", listRisks);
router.post("/:projectId", createRisk);
router.patch("/:projectId/:riskId", updateRisk);
router.delete("/:projectId/:riskId", deleteRisk);

export default router;
