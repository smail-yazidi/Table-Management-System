// app/api/tables-with-reservations/route.ts
import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Table from "@/lib/models/Table"
import Reservation from "@/lib/models/Reservation"

export async function GET(req: NextRequest) {
  await dbConnect()

  try {
    const now = new Date()
    const allReservations = await Reservation.find()
      .populate("tutorId")
      .populate("tableId")

    const activeReservations = allReservations.filter((r) => {
      const start = new Date(r.datetime)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      return now >= start && now < end
    })

    const tables = await Table.find()
    const tablesWithTutors = tables.map((table) => {
      const reservation = activeReservations.find(
        (r) => r.tableId._id.toString() === table._id.toString()
      )
      return {
        ...table.toObject(),
        reservedTutor: reservation ? reservation.tutorId : null,
      }
    })

    return NextResponse.json(tablesWithTutors, { status: 200 })
  } catch (error: any) {
    console.error("❌ Error in tables-with-reservations:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
