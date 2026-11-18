import Project from "../models/Project.js";
import Task from "../models/Task.js";

export async function getStats(req, res, next) {
  try {
    const owner = req.user._id;
    const [projectCounts, taskCounts, recentProjects, overdueTasks] = await Promise.all([
      Project.aggregate([{ $match: { owner } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: { owner } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Project.find({ owner }).sort({ updatedAt: -1 }).limit(5).lean(),
      Task.find({ owner, dueDate: { $lt: new Date() }, status: { $ne: "Done" } }).populate("project", "name").sort({ dueDate: 1 }).limit(5)
    ]);
    const totalProjects = projectCounts.reduce((s, x) => s + x.count, 0);
    const totalTasks = taskCounts.reduce((s, x) => s + x.count, 0);
    const doneTasks = taskCounts.find(x => x._id === "Done")?.count || 0;
    res.json({
      projects: { total: totalProjects, byStatus: projectCounts },
      tasks: { total: totalTasks, completed: doneTasks, completionRate: totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0, byStatus: taskCounts },
      recentProjects, overdueTasks
    });
  } catch (err) { next(err); }
}
