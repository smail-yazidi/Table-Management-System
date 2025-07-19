import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(); // use default DB from connection string

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get reservations within last hour
    const reservations = await db
      .collection("reservations")
      .find({
        datetime: { $gte: oneHourAgo, $lte: now },
      })
      .toArray();

    // Fetch all tables
    const tables = await db.collection("tables").find().toArray();

    // Optionally, fetch tutors if you want to embed tutor info too:
    // const tutorIds = [...new Set(reservations.map(r => r.tutor).filter(Boolean))];
    // const tutors = await db.collection("tutors").find({_id: { $in: tutorIds.map(id => new ObjectId(id)) }}).toArray();
    // Create a map for quick tutor lookup by _id if needed.

    // Attach reservation to corresponding table
    const tablesWithReservations = tables.map((table) => {
      const reservation = reservations.find(
        (r) => r.table?.toString() === table._id.toString()
      );

      return {
        ...table,
        reservation: reservation || null,
      };
    });

    return res.status(200).json(tablesWithReservations);
  } catch (error) {
    console.error("Error in tables-with-reservations API:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
