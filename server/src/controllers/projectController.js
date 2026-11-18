import User from "../models/User.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { calculateCriticalPath } from "../services/criticalPathService.js";

export async function listProjects(req, res, next) {
  try {
    const projects = await Project.find({ owner: req.user._id }).sort({ updatedAt: -1 }).lean();
    const ids = projects.map(p => p._id);
    const counts = await Task.aggregate([
      { $match: { owner: req.user._id, project: { $in: ids } } },
      { $group: { _id: "$project", total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ["$status", "Done"] }, 1, 0] } } } }
    ]);
    const byId = new Map(counts.map(c => [String(c._id), c]));
    res.json(projects.map(p => {
      const c = byId.get(String(p._id)) || { total: 0, done: 0 };
      return { ...p, taskCount: c.total, completedTasks: c.done, progress: c.total ? Math.round(c.done / c.total * 100) : 0 };
    }));
  } catch (err) { next(err); }
}

export async function createProject(req, res, next) {
  try {
    const { name, description, priority, status, startDate, dueDate } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Project name is required" });
    const project = await Project.create({
      name, description, priority, status,
      startDate: startDate || undefined, dueDate: dueDate || undefined,
      owner: req.user._id
    });
    res.status(201).json(project);
  } catch (err) { next(err); }
}

export async function getProject(req, res, next) {
  try {
    const project = await Project.findOne({
  _id: req.params.id,
  owner: req.user._id
}).populate("members", "name email role");
    if (!project) return res.status(404).json({ message: "Project not found" });
    const tasks = await Task.find({ project: project._id, owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ project, tasks });
  } catch (err) { next(err); }
}

export async function updateProject(req, res, next) {
  try {
    const allowed = ["name", "description", "priority", "status", "startDate", "dueDate"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id }, updates,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) { next(err); }
}

export async function deleteProject(req, res, next) {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found" });
    await Task.deleteMany({ project: project._id, owner: req.user._id });
    res.json({ message: "Project and its tasks deleted" });
  } catch (err) { next(err); }
}

export async function addProjectMember(req, res, next) {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "No registered user found with this email"
      });
    }

    if (String(user._id) === String(project.owner)) {
      return res.status(400).json({
        message: "Project owner is already part of this project"
      });
    }

    await Project.updateOne(
      { _id: project._id, owner: req.user._id },
      { $addToSet: { members: user._id } }
    );

    const updatedProject = await Project.findById(project._id)
      .populate("members", "name email role");

    res.json(updatedProject);
  } catch (err) {
    next(err);
  }
}

export async function removeProjectMember(req, res, next) {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { $pull: { members: req.params.userId } },
      { new: true, runValidators: true }
    ).populate("members", "name email role");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
}

export async function getProjectCriticalPath(req, res, next) {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const tasks = await Task.find({
      project: project._id,
      owner: req.user._id
    }).populate("dependencies", "title estimatedDuration");

    const result = calculateCriticalPath(tasks);

    res.json(result);
  } catch (err) {
    next(err);
  }
}


