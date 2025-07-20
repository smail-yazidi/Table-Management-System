import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Table from "@/lib/models/Table"


// DELETE /api/tables/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()

  try {
    const deletedTable = await Table.findByIdAndDelete(params.id)

    if (!deletedTable) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Table deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 })
  }
}
