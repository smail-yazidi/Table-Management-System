import { NextRequest, NextResponse } from 'next/server'
import dbConnect from "@/lib/db"
import Tutor from "@/lib/models/Tutor"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()

  try {
    const tutor = await Tutor.findById(params.id)
    if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

    return NextResponse.json(tutor)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch tutor' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const data = await req.json()

  try {
    const updatedTutor = await Tutor.findByIdAndUpdate(params.id, data, { new: true })
    if (!updatedTutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

    return NextResponse.json(updatedTutor)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update tutor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()

  try {
    const deletedTutor = await Tutor.findByIdAndDelete(params.id)
    if (!deletedTutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

    return NextResponse.json({ message: 'Tutor deleted successfully' })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete tutor' }, { status: 500 })
  }
}
