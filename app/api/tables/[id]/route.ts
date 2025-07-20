import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Table from "@/lib/models/Table"
import Reservation from "@/lib/models/Reservation"

// DELETE /api/tables/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()

  try {
    const table = await Table.findById(params.id)
    if (!table) {
      return NextResponse.json({ message: "Table not found" }, { status: 404 })
    }

    // Delete related reservations
    await Reservation.deleteMany({ tableId: params.id })

    // Delete the table itself
    await Table.findByIdAndDelete(params.id)

    return NextResponse.json({ message: "Table and related reservations deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete table" }, { status: 500 })
  }
}
