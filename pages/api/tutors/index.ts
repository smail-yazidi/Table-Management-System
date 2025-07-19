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
      return res.status(500).json({ error: "Failed to fetch tutors" })
    }
  }

  if (req.method === "POST") {
    try {
      const { firstName, lastName, image } = req.body

      if (!firstName || !lastName) {
        return res.status(400).json({ error: "firstName and lastName are required" })
      }

      const newTutor = await Tutor.create({ firstName, lastName, image: image || null })
      return res.status(201).json(newTutor)
    } catch (error) {
      return res.status(500).json({ error: "Failed to create tutor" })
    }
  }

  res.setHeader("Allow", ["GET", "POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
