import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import { useId } from "react";

export default async function handler(req, res) {
  // Check if user is authenticated
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  // Create new apikeys
  if (req.method === "POST") {
    try {
      const { exchange, apikey, secretkey, passphrase, uid, nickname, subaccount } = req.body;
      console.log("exchange: ", exchange);
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      const apikeys = await prisma.apikeys.create({
        data: {
          exchange,
          apikey,
          secretkey,
          passphrase,
          uid,
          nickname,
          subaccount,
          ownerId: user.id,
        },
      });
      res.status(200).json(apikeys);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
  // HTTP method not supported!
  else {
    res.setHeader("Allow", ["POST"]);
    res
      .status(405)
      .json({ message: `HTTP method ${req.method} is not supported.` });
  }
}
