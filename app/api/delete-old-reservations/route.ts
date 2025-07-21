
// app/api/delete-old-reservations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import Reservation from "@/lib/models/Reservation";
import { loadMongooseModels } from "@/lib/models"; // Ensure models are loaded

export async function POST(request: NextRequest) {
  try {
    await dbConnect(); // Ensure DB connection and models are loaded

    // Calculate the time one hour ago from the current moment
    const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60);

    // Log for debugging: what time are we considering "old"?
    console.log(`SERVER: Attempting to delete reservations with datetime older than: ${oneHourAgo.toISOString()}`);

    // Delete reservations where the 'datetime' field is older than one hour ago.
    // This aligns with your reservation logic where a reservation is active for 1 hour.
    const result = await Reservation.deleteMany({
      datetime: { $lt: oneHourAgo },
    });

    console.log(`SERVER: Successfully deleted ${result.deletedCount} old reservations.`);

    return NextResponse.json({
      message: `Deleted ${result.deletedCount} old reservations`,
      deletedCount: result.deletedCount, // Include deletedCount for clarity
      success: true,
    });
  } catch (error: any) {
    console.error('SERVER: Error deleting old reservations:', error);
    return NextResponse.json(
      { message: 'Failed to delete old reservations', success: false, error: error.message },
      { status: 500 }
    );
  }
}

