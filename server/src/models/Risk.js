
import mongoose from "mongoose";

const riskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  description: {
    type: String,
    default: ""
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  probability: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  impact: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  mitigation: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["Open", "Mitigating", "Resolved"],
    default: "Open"
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

// Automatically calculate risk score
riskSchema.virtual("riskScore").get(function () {
  return this.probability * this.impact;
});

riskSchema.set("toJSON", { virtuals: true });
riskSchema.set("toObject", { virtuals: true });

export default mongoose.model("Risk", riskSchema);
