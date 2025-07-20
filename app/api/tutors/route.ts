// app/api/tutors/route.ts
import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Tutor from "@/lib/models/Tutor"

// GET /api/tutors
export async function GET(req: NextRequest) {
  await dbConnect()

  try {
    const tutors = await Tutor.find()
    return NextResponse.json(tutors)
  } catch (error) {
    console.error("❌ Failed to fetch tutors:", error)
    return NextResponse.json({ error: "Failed to fetch tutors" }, { status: 500 })
  }
}

// POST /api/tutors
export async function POST(req: NextRequest) {
  await dbConnect()

  try {
    const body = await req.json()
    const { firstName, lastName, image } = body

    console.log("📥 Incoming tutor data:", { firstName, lastName, image })

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "firstName and lastName are required" },
        { status: 400 }
      )
    }

    const newTutor = await Tutor.create({ firstName, lastName, image: image || null })
    console.log("✅ Tutor saved to MongoDB:", newTutor)

    return NextResponse.json(newTutor, { status: 201 })
  } catch (error: any) {
    console.error("❌ Error adding tutor:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
