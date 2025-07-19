// /pages/api/tutors/index.ts
import type { NextApiRequest, NextApiResponse } from "next"
import dbConnect from "@/lib/db"
import Tutor from "@/lib/models/Tutor"
import formidable from "formidable"

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  if (req.method === "POST") {
    const form = formidable({ keepExtensions: true })

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: "Form parsing error" })
      }

      const { firstName, lastName } = fields
      const imageUrl = fields.image || null // assume image URL was uploaded to Cloudinary on the frontend

      if (!firstName || !lastName) {
        return res.status(400).json({ error: "firstName and lastName are required" })
      }

      try {
        const tutor = await Tutor.create({
          firstName,
          lastName,
          image: imageUrl,
        })

        return res.status(201).json(tutor)
      } catch (error) {
        return res.status(500).json({ error: "Failed to save tutor" })
      }
    })
    return
  }

  if (req.method === "GET") {
    try {
      const tutors = await Tutor.find()
      return res.status(200).json(tutors)
    } catch {
      return res.status(500).json({ error: "Failed to fetch tutors" })
    }
  }

  res.setHeader("Allow", ["GET", "POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
