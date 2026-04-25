import mongoose from "mongoose";

const neuroProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    completedSteps: {
      type: [String],
      default: [],
    },
    quizScore: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const NeuroProgress =
  mongoose.models.NeuroProgress ||
  mongoose.model("NeuroProgress", neuroProgressSchema);
