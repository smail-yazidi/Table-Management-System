
// app/api/tutors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Tutor from "@/lib/models/Tutor"; // Assuming this path is correct
import Reservation from "@/lib/models/Reservation"; // Assuming this path is correct
import { del } from '@vercel/blob'; // Import the Vercel Blob delete function

// DELETE /api/tutors/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    const tutorId = params.id;

    // 1. Find the tutor to get the image URL
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    // 2. Delete the associated image from Vercel Blob (if it exists)
    if (tutor.image) {
      try {
        console.log(`SERVER: Deleting image from Vercel Blob: ${tutor.image}`);
        await del(tutor.image); // Use the del function with the image URL
        console.log(`SERVER: Image ${tutor.image} deleted from Vercel Blob.`);
      } catch (blobError) {
        // Log the error but don't prevent tutor deletion if image deletion fails
        console.error(`SERVER: Failed to delete image ${tutor.image} from Vercel Blob:`, blobError);
        // You might want to notify an admin here or have a retry mechanism
      }
    }

    // 3. Delete any reservations associated with this tutor
    // This is crucial to maintain data integrity.
    await Reservation.deleteMany({ 'tutor._id': tutorId }); // Assuming tutor field is embedded or referenced correctly

    // 4. Delete the tutor document from MongoDB
    await Tutor.findByIdAndDelete(tutorId);

    console.log(`SERVER: Tutor ${tutorId} and associated reservations/image deleted successfully.`);

    return NextResponse.json({ message: "Tutor and associated data deleted successfully" });
  } catch (error: any) {
    console.error(`SERVER: Error deleting tutor:`, error);
    return NextResponse.json({ error: error.message || "Failed to delete tutor" }, { status: 500 });
  }
}

