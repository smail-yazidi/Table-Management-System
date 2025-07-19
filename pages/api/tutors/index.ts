// pages/api/tutors.ts

import { IncomingForm } from 'formidable';
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db('studyhall');
  const tutors = db.collection('tutors');

  switch (req.method) {
    case 'POST':
      try {
        const data: any = await new Promise((resolve, reject) => {
          const form = new IncomingForm({ keepExtensions: true });
          form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
          });
        });

        const { firstName, lastName } = data.fields;

        await tutors.insertOne({
          firstName,
          lastName,
          image: null, // You can replace this later with file path or Cloudinary URL
        });

        return res.status(201).json({ message: 'Tutor added' });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to add tutor' });
      }

    case 'GET':
      const allTutors = await tutors.find().toArray();
      return res.status(200).json(allTutors);

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
