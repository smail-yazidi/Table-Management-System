// lib/models/Tutor.ts
import mongoose from "mongoose";

const TutorSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    image: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Tutor || mongoose.model("Tutor", TutorSchema);
