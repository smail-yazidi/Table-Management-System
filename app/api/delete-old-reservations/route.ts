import { NextRequest, NextResponse } from 'next/server'
import dbConnect  from "@/lib/db"
import Reservation from "@/lib/models/Reservation"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60)

    // Delete reservations older than 1 hour using Mongoose model
    const result = await Reservation.deleteMany({
      createdAt: { $lt: oneHourAgo },
    })

    return NextResponse.json({
      message: `Deleted ${result.deletedCount} old reservations`,
      success: true,
    })
  } catch (error) {
    console.error('Error deleting old reservations:', error)
    return NextResponse.json(
      { message: 'Failed to delete old reservations', success: false },
      { status: 500 }
    )
  }
}
