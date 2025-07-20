// /pages/api/tables/index.ts
import type { NextApiRequest, NextApiResponse } from "next"
import dbConnect from "@/lib/db"
import Table from "@/lib/models/Table"
import Reservation from "@/lib/models/Reservation"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  if (req.method === "GET") {
    const tables = await Table.find()
    return res.status(200).json(tables)
  }

  if (req.method === "POST") {
    const table = await Table.create(req.body)
    return res.status(201).json(table)
  }

  if (req.method === "DELETE") {
    const { id } = req.query
    await Reservation.deleteMany({ tableId: id })
    await Table.findByIdAndDelete(id)
    return res.status(200).json({ message: "Table and related reservations deleted" })
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
