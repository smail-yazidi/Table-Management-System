import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db('studyhall');
  const tables = db.collection('tables');

  switch (req.method) {
    case 'GET': {
      const allTables = await tables.find().toArray();
      return res.status(200).json(allTables);
    }
    case 'POST': {
      const result = await tables.insertOne(req.body);
      return res.status(201).json(result);
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}