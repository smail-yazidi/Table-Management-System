// /lib/models/Tutor.ts
import mongoose from "mongoose"

const TutorSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  image: String,
})

export default mongoose.models.Tutor || mongoose.model("Tutor", TutorSchema)
