// /pages/api/reservations/index.ts
import type { NextApiRequest, NextApiResponse } from "next"
import dbConnect from "@/lib/db"
import Reservation from "@/lib/models/Reservation"
import Tutor from "@/lib/models/Tutor"
import Table from "@/lib/models/Table"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  if (req.method === "GET") {
    const reservations = await Reservation.find().populate("tutorId").populate("tableId")
    return res.status(200).json(reservations)
  }

  if (req.method === "POST") {
    const { tableId, tutorId } = req.body
    const now = new Date()

    const existing = await Reservation.findOne({ tutorId, datetime: now })
    if (existing) {
      return res.status(400).json({ error: "Tutor already has a reservation at this moment" })
    }

    const taken = await Reservation.findOne({ tableId, datetime: now })
    if (taken) {
      return res.status(400).json({ error: "Table already reserved at this moment" })
    }

    await Reservation.create({ tutorId, tableId, datetime: now })
    return res.status(200).json({ message: "Reservation successful" })
  }

  res.setHeader("Allow", ["GET", "POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
