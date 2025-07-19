import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db('studyhall');
  const tutors = db.collection('tutors');

  switch (req.method) {
    case 'GET': {
      const allTutors = await tutors.find().toArray();
      return res.status(200).json(allTutors);
    }
    case 'POST': {
      const { firstName, lastName, image } = req.body;
      const result = await tutors.insertOne({ firstName, lastName, image });
      return res.status(201).json(result);
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}