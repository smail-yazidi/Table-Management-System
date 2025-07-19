import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get reservations within last hour
    const reservations = await db
      .collection("reservations")
      .find({
        datetime: { $gte: oneHourAgo, $lte: now },
      })
      .toArray();

    // Get all tables
    const tables = await db.collection("tables").find().toArray();

    // Get tutor IDs from reservations and fetch tutors
    const tutorIds = [...new Set(reservations.map(r => r.tutor).filter(Boolean))].map(id => new ObjectId(id));
    const tutors = tutorIds.length
      ? await db.collection("tutors").find({ _id: { $in: tutorIds } }).toArray()
      : [];

    // Create a map of tutors by id string
    const tutorsMap = new Map(tutors.map(t => [t._id.toString(), t]));

    // Compose tables with reservedTutor embedded if reserved
    const tablesWithReservations = tables.map(table => {
      const reservation = reservations.find(r => r.table?.toString() === table._id.toString());
      const reservedTutor = reservation ? tutorsMap.get(reservation.tutor?.toString() || "") || null : null;

      return {
        ...table,
        reservedTutor,
      };
    });

    res.status(200).json(tablesWithReservations);
  } catch (error) {
    console.error("Error in tables-with-reservations API:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
