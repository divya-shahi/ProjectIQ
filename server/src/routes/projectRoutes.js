
import { Router } from "express";

import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectCriticalPath
} from "../controllers/projectController.js";

const router = Router();

router.get("/", listProjects);
router.post("/", createProject);
router.get("/:id/critical-path", getProjectCriticalPath);
router.get("/:id", getProject);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);

router.post("/:id/members", addProjectMember);
router.delete("/:id/members/:userId", removeProjectMember);

export default router;
