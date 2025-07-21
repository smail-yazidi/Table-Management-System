// app/api/tables-with-reservations/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Table from "@/lib/models/Table";
import Reservation from "@/lib/models/Reservation";
import Tutor from "@/lib/models/Tutor"; // Explicitly imported here, but loadMongooseModels will ensure it.

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const now = new Date();
    const allReservations = await Reservation.find()
      .populate("tutorId")
      .populate("tableId");

    const activeReservations = allReservations.filter((r: any) => { // Added :any for r for type safety
      const start = new Date(r.datetime);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      return now >= start && now < end;
    });

    const tables = await Table.find();
    const tablesWithTutors = tables.map((table: any) => { // Added :any for table for type safety
      const reservation = activeReservations.find(
        (r: any) => r.tableId._id.toString() === table._id.toString()
      );
      return {
        ...table.toObject(),
        reservedTutor: reservation ? reservation.tutorId : null,
      };
    });

    return NextResponse.json(tablesWithTutors, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error in tables-with-reservations:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
