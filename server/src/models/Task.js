
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000, default: "" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  status: { type: String, enum: ["To Do", "In Progress", "Done"], default: "To Do" },
  priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
  dueDate: { type: Date },
  estimatedDuration: {
  type: Number,
  required: true,
  default: 1,
  min: 1
},
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  dependencies: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "Task"
}]
}, { timestamps: true });

taskSchema.index({ owner: 1, project: 1, status: 1 });
taskSchema.index({ assignee: 1 });

export default mongoose.model("Task", taskSchema);
