// /app/api/reservations/route.ts
import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Reservation from "@/lib/models/Reservation"


export async function POST(req: NextRequest) {
  await dbConnect()

  const { tableId, tutorId, datetime } = await req.json()

  if (!tableId || !tutorId || !datetime) {
    return NextResponse.json(
      { error: "tutorId, tableId, and datetime are required" },
      { status: 400 }
    )
  }

  const requestedStart = new Date(datetime)
  const requestedEnd = new Date(requestedStart.getTime() + 60 * 60 * 1000) // 1 hour slot

  // Check if tutor already has a reservation that overlaps
  const tutorConflict = await Reservation.findOne({
    tutorId,
    datetime: {
      $lt: requestedEnd,
      $gte: new Date(requestedStart.getTime() - 60 * 60 * 1000),
    },
  })

  if (tutorConflict) {
    return NextResponse.json(
      { error: "Tutor already has a reservation around this time" },
      { status: 400 }
    )
  }

  // Check if table is already reserved during that time
  const tableConflict = await Reservation.findOne({
    tableId,
    datetime: {
      $lt: requestedEnd,
      $gte: new Date(requestedStart.getTime() - 60 * 60 * 1000),
    },
  })

  if (tableConflict) {
    return NextResponse.json(
      { error: "Table is already reserved around this time" },
      { status: 400 }
    )
  }

  await Reservation.create({ tutorId, tableId, datetime: requestedStart })

  return NextResponse.json({ message: "Reservation successful" }, { status: 201 })
}

