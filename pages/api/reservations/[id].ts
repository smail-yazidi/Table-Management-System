import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/db';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db('studyhall');
  const reservations = db.collection('reservations');
  const { id } = req.query;

  if (req.method === 'DELETE') {
    const result = await reservations.deleteOne({ _id: new ObjectId(id as string) });
    return res.status(200).json({ message: 'Deleted', deletedCount: result.deletedCount });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
