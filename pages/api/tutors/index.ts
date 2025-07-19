// /pages/api/tutors/index.ts
import type { NextApiRequest, NextApiResponse } from "next"
import dbConnect from "@/lib/db"
import Tutor from "@/lib/models/Tutor"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  if (req.method === "GET") {
    const tutors = await Tutor.find()
    return res.status(200).json(tutors)
  }

  if (req.method === "POST") {
    const { firstName, lastName, image } = req.body
    const newTutor = await Tutor.create({ firstName, lastName, image })
    return res.status(201).json(newTutor)
  }

  res.setHeader("Allow", ["GET", "POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
