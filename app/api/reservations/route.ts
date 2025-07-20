// /app/api/reservations/route.ts
import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Reservation from "@/lib/models/Reservation"

export async function GET() {
  await dbConnect()
  const reservations = await Reservation.find()
    .populate("tutorId")
    .populate("tableId")
  return NextResponse.json(reservations)
}

export async function POST(req: NextRequest) {
  await dbConnect()

  const { tableId, tutorId } = await req.json()
  const now = new Date()

  const existing = await Reservation.findOne({ tutorId, datetime: now })
  if (existing) {
    return NextResponse.json(
      { error: "Tutor already has a reservation at this moment" },
      { status: 400 }
    )
  }

  const taken = await Reservation.findOne({ tableId, datetime: now })
  if (taken) {
    return NextResponse.json(
      { error: "Table already reserved at this moment" },
      { status: 400 }
    )
  }

  await Reservation.create({ tutorId, tableId, datetime: now })
  return NextResponse.json({ message: "Reservation successful" }, { status: 200 })
}
