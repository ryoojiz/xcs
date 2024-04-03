import clientPromise from "@/lib/mongodb";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const statistics = db.collection('statistics');
  const globalStatistics = await statistics.findOne({ id: 'global' });

  if (globalStatistics) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(500).json({ success: false });
  }
}