
import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Tutor from "@/lib/models/Tutor"
import Reservation from "@/lib/models/Reservation"

// DELETE /api/tutors/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    const tutor = await Tutor.findById(params.id);
    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    // Delete all reservations linked to this tutor
    await Reservation.deleteMany({ tutorId: params.id });

    // Delete the tutor
    await Tutor.findByIdAndDelete(params.id);

    return NextResponse.json({ message: "Tutor and related reservations deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
// PUT /api/tutors/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()

  try {
    const data = await req.json()

    const updatedTutor = await Tutor.findByIdAndUpdate(params.id, data, {
      new: true,
      runValidators: true,
    })

    if (!updatedTutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 })
    }

    return NextResponse.json(updatedTutor)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}