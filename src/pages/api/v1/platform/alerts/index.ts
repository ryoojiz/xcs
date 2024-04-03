import { authToken } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { Alert, User } from "@/types";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DB as string);
  const platform = db.collection("platform");

  // get all alerts
  if (req.method === "GET") {
    const doc = await platform.findOne({ id: "main" });
    const alerts = doc?.alerts || [];

    return res.status(200).json(alerts);
  } else if (req.method === "POST") { // post new alert, staff only
    const { alert } = req.body as { alert: Alert };

    // check if user is staff
    const uid = await authToken(req);
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const users = db.collection("users");
    const user = await users.findOne({ id: uid }) as User | null;
    if (!user?.platform.staff) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // verify fields
    if (!alert.title || !alert.type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // add alert
    // TODO: multiple alerts
    await platform.updateOne({ id: "main" }, {
      $set: {
        alerts: [alert]
      }
    });
  }
}