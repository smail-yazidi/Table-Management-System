
// app/api/tutors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Tutor from "@/lib/models/Tutor"
import Reservation from "@/lib/models/Reservation"
import { del } from '@vercel/blob'; // Import the Vercel Blob delete function

// DELETE /api/tutors/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect()

  try {
    const tutorId = params.id;
    console.log(`SERVER: Attempting to delete tutor with ID: ${tutorId}`);

    // 1. Find the tutor to get the image URL before deletion
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      console.log(`SERVER: Tutor with ID ${tutorId} not found.`);
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    // 2. Delete the associated image from Vercel Blob (if it exists)
    if (tutor.image) {
      try {
        console.log(`SERVER: Attempting to delete image from Vercel Blob: ${tutor.image}`);
        await del(tutor.image); // Use the del function with the image URL
        console.log(`SERVER: Image ${tutor.image} successfully deleted from Vercel Blob.`);
      } catch (blobError: any) {
        // Log the error but don't prevent tutor deletion if image deletion fails
        console.error(`SERVER: Failed to delete image ${tutor.image} from Vercel Blob:`, blobError.message || blobError);
        // You might want to implement a retry mechanism or a way to track orphaned images here
      }
    } else {
      console.log(`SERVER: No image found for tutor ${tutorId}, skipping Blob deletion.`);
    }

    // 3. Delete all reservations linked to this tutor
    // Assuming 'tutorId' in Reservation model directly stores the tutor's _id
    await Reservation.deleteMany({ tutorId: tutorId });
    console.log(`SERVER: Reservations for tutor ${tutorId} deleted.`);


    // 4. Delete the tutor
    await Tutor.findByIdAndDelete(tutorId);
    console.log(`SERVER: Tutor ${tutorId} document deleted from MongoDB.`);

    return NextResponse.json({ message: "Tutor and related data deleted successfully" });
  } catch (err: any) {
    console.error(`SERVER: Error deleting tutor ${params.id}:`, err.message || err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// PUT /api/tutors/:id (kept as is, but ensure it handles 'image' field update)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect()

  try {
    const data = await req.json()
    console.log(`SERVER: Attempting to update tutor ${params.id} with data:`, data);

    const updatedTutor = await Tutor.findByIdAndUpdate(params.id, data, {
      new: true,
      runValidators: true,
    })

    if (!updatedTutor) {
      console.log(`SERVER: Tutor with ID ${params.id} not found for update.`);
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 })
    }

    console.log(`SERVER: Tutor ${params.id} updated successfully:`, updatedTutor);
    return NextResponse.json(updatedTutor)
  } catch (err: any) {
    console.error(`SERVER: Error updating tutor ${params.id}:`, err.message || err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}

