import mongoose from "mongoose";
import Task from "../models/Task.js";
import Project from "../models/Project.js";

export async function listTasks(req, res, next) {
  try {
    const filter = {
      $or: [
        { owner: req.user._id },
        { assignee: req.user._id }
      ]
    };

    if (req.query.project) filter.project = req.query.project;
    if (req.query.status) filter.status = req.query.status;

    const tasks = await Task.find(filter)
      .populate("project", "name")
      .populate("assignee", "name email")
      .populate("dependencies", "title status")
      .sort({ dueDate: 1, createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const {
  title,
  description,
  project,
  status,
  priority,
  dueDate,
  assignee,
  dependencies = [],
  estimatedDuration = 1
} = req.body;

    if (!title?.trim() || !project) {
      return res.status(400).json({
        message: "Task title and project are required"
      });
    }

    const ownedProject = await Project.findOne({
      _id: project,
      owner: req.user._id
    });

    if (!ownedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (assignee && !ownedProject.members.some(
      member => String(member) === String(assignee)
    )) {
      return res.status(400).json({
        message: "Assignee must be a member of this project"
      });
    }

    if (!Array.isArray(dependencies)) {
  return res.status(400).json({
    message: "Dependencies must be an array"
  });
}

const uniqueDependencies = [...new Set(dependencies.map(String))];

if (uniqueDependencies.some(id => !mongoose.isValidObjectId(id))) {
  return res.status(400).json({
    message: "Invalid dependency ID"
  });
}

const validDependencies = await Task.find({
  _id: { $in: uniqueDependencies },
  project,
  owner: req.user._id
});

if (validDependencies.length !== uniqueDependencies.length) {
  return res.status(400).json({
    message: "Dependencies must belong to the same project"
  });
}

    const task = await Task.create({
      title, description, project, status, priority,
      dueDate: dueDate || undefined,
      assignee: assignee || null,
      owner: req.user._id,
      dependencies: uniqueDependencies,
      estimatedDuration: Number(estimatedDuration)
    });

    res.status(201).json(
      await task.populate([
        { path: "project", select: "name" },
        { path: "assignee", select: "name email" }
      ])
    );
  } catch (err) {
    next(err);
  }
}


export async function updateTask(req, res, next) {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const allowed = [
  "title",
  "description",
  "status",
  "priority",
  "dueDate",
  "estimatedDuration"
];

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key))
    );
    if (Object.hasOwn(updates, "estimatedDuration")) {
  updates.estimatedDuration = Number(updates.estimatedDuration);

  if (
    !Number.isInteger(updates.estimatedDuration) ||
    updates.estimatedDuration < 1
  ) {
    return res.status(400).json({
      message: "Estimated duration must be a positive whole number"
    });
  }
}

    // Validate assignee
    if (Object.hasOwn(req.body, "assignee")) {
      const project = await Project.findOne({
        _id: task.project,
        owner: req.user._id
      });

      const assignee = req.body.assignee;

      if (assignee && !project.members.some(
        member => String(member) === String(assignee)
      )) {
        return res.status(400).json({
          message: "Assignee must be a member of this project"
        });
      }

      updates.assignee = assignee || null;
    }

    // Validate dependencies
    if (Object.hasOwn(req.body, "dependencies")) {
      const dependencies = req.body.dependencies;

      if (!Array.isArray(dependencies)) {
        return res.status(400).json({
          message: "Dependencies must be an array"
        });
      }

      const uniqueDependencies = [...new Set(dependencies.map(String))];

      if (uniqueDependencies.some(
        id => !mongoose.isValidObjectId(id)
      )) {
        return res.status(400).json({
          message: "Invalid dependency ID"
        });
      }

      if (uniqueDependencies.includes(String(task._id))) {
        return res.status(400).json({
          message: "A task cannot depend on itself"
        });
      }

      const validDependencies = await Task.find({
        _id: { $in: uniqueDependencies },
        project: task.project,
        owner: req.user._id
      });

      if (validDependencies.length !== uniqueDependencies.length) {
        return res.status(400).json({
          message: "Dependencies must belong to the same project"
        });
      }

      // Check for circular dependencies
      for (const dependencyId of uniqueDependencies) {
        const visited = new Set();
        const stack = [dependencyId];

        while (stack.length > 0) {
          const currentId = stack.pop();

          if (currentId === String(task._id)) {
            return res.status(400).json({
              message: "Circular task dependencies are not allowed"
            });
          }

          if (visited.has(currentId)) continue;
          visited.add(currentId);

          const currentTask = await Task.findOne({
            _id: currentId,
            owner: req.user._id
          }).select("dependencies");

          if (currentTask) {
            stack.push(
              ...currentTask.dependencies.map(String)
            );
          }
        }
      }

      updates.dependencies = uniqueDependencies;
    }

    Object.assign(task, updates);
    await task.save();

    await task.populate([
      { path: "project", select: "name" },
      { path: "assignee", select: "name email" },
      { path: "dependencies", select: "title status" }
    ]);

    res.json(task);
  } catch (err) {
    next(err);
  }
}


export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
}
