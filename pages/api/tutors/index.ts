// /pages/api/tutors/index.ts
import type { NextApiRequest, NextApiResponse } from "next"
import dbConnect from "@/lib/db"
import Tutor from "@/lib/models/Tutor"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  if (req.method === "GET") {
    try {
      const tutors = await Tutor.find()
      return res.status(200).json(tutors)
    } catch (error) {
      console.error("❌ Failed to fetch tutors:", error)
      return res.status(500).json({ error: "Failed to fetch tutors" })
    }
  }

  if (req.method === "POST") {
    try {
      const { firstName, lastName, image } = req.body

      // 🟡 Debug log — see what you're receiving
      console.log("📥 Incoming tutor data:", {
        firstName,
        lastName,
        image,
      })

      // ✅ Basic validation
      if (!firstName || !lastName) {
        return res.status(400).json({ error: "firstName and lastName are required" })
      }

      const newTutor = await Tutor.create({ firstName, lastName, image: image || null })

      console.log("✅ Tutor saved to MongoDB:", newTutor)

      return res.status(201).json(newTutor)
    } catch (error: any) {
      console.error("❌ Error adding tutor:", error)
      return res.status(500).json({ error: error.message || "Internal Server Error" })
    }
  }

  res.setHeader("Allow", ["GET", "POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
