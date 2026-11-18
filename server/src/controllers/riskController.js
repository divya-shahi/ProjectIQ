
import Risk from "../models/Risk.js";
import Project from "../models/Project.js";

export async function listRisks(req, res, next) {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const risks = await Risk.find({
      project: project._id,
      owner: req.user._id
    }).sort({ createdAt: -1 });

    res.json(risks);
  } catch (err) {
    next(err);
  }
}

export async function createRisk(req, res, next) {
  try {
    const {
      title,
      description,
      probability,
      impact,
      mitigation
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Risk title is required"
      });
    }

    const project = await Project.findOne({
      _id: req.params.projectId,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const risk = await Risk.create({
      title,
      description,
      probability,
      impact,
      mitigation,
      project: project._id,
      owner: req.user._id
    });

    res.status(201).json(risk);
  } catch (err) {
    next(err);
  }
}

export async function updateRisk(req, res, next) {
  try {
    const allowed = [
      "title",
      "description",
      "probability",
      "impact",
      "mitigation",
      "status"
    ];

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) =>
        allowed.includes(key)
      )
    );

    const risk = await Risk.findOneAndUpdate(
      {
        _id: req.params.riskId,
        project: req.params.projectId,
        owner: req.user._id
      },
      updates,
      { new: true, runValidators: true }
    );

    if (!risk) {
      return res.status(404).json({ message: "Risk not found" });
    }

    res.json(risk);
  } catch (err) {
    next(err);
  }
}

export async function deleteRisk(req, res, next) {
  try {
    const risk = await Risk.findOneAndDelete({
      _id: req.params.riskId,
      project: req.params.projectId,
      owner: req.user._id
    });

    if (!risk) {
      return res.status(404).json({ message: "Risk not found" });
    }

    res.json({ message: "Risk deleted successfully" });
  } catch (err) {
    next(err);
  }
}
