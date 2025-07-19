// /pages/api/tables-with-reservations/index.ts
import type { NextApiRequest, NextApiResponse } from "next"
import dbConnect from "@/lib/db"
import Table from "@/lib/models/Table"
import Reservation from "@/lib/models/Reservation"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  const now = new Date()
  const allReservations = await Reservation.find().populate("tutorId").populate("tableId")

  const activeReservations = allReservations.filter((r) => {
    const start = new Date(r.datetime)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    return now >= start && now < end
  })

  const tables = await Table.find()
  const tablesWithTutors = tables.map((table) => {
    const reservation = activeReservations.find((r) => r.tableId._id.toString() === table._id.toString())
    return {
      ...table.toObject(),
      reservedTutor: reservation ? reservation.tutorId : null,
    }
  })

  res.status(200).json(tablesWithTutors)
}
