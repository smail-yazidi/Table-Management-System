import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db('studyhall');
  const reservations = db.collection('reservations');

  switch (req.method) {
    case 'GET': {
      const all = await reservations.find().toArray();
      return res.status(200).json(all);
    }
    case 'POST': {
      const { tutorId, tableId } = req.body;
      const datetime = new Date();

      const existingTutor = await reservations.findOne({ tutorId, datetime });
      const existingTable = await reservations.findOne({ tableId, datetime });

      if (existingTutor) return res.status(400).json({ error: 'Tutor already reserved at this time' });
      if (existingTable) return res.status(400).json({ error: 'Table already reserved at this time' });

      const result = await reservations.insertOne({ tutorId, tableId, datetime });
      return res.status(201).json(result);
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}