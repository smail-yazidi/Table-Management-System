import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db('studyhall');
    const tables = db.collection('tables');

    switch (req.method) {
      case 'GET': {
        const allTables = await tables.find().toArray();
        return res.status(200).json(allTables);
      }
      case 'POST': {
        const newTable = req.body;

        // Basic validation example (customize as needed)
        if (!newTable || typeof newTable !== 'object' || Array.isArray(newTable)) {
          return res.status(400).json({ error: 'Invalid data format' });
        }

        const result = await tables.insertOne(newTable);
        return res.status(201).json({ insertedId: result.insertedId });
      }
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
