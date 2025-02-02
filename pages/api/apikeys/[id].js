import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default async function handler(req, res) {
  // Check if user is authenticated
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // Retrieve the authenticated user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { listedAPIKeys: true },
  });

  // Check if authenticated user is the owner of this home
  const { id } = req.query;
  if (!user?.listedAPIKeys?.find(apikeys => apikeys.id === id)) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // Update home
  if (req.method === 'PATCH') {
    try {
      const apikeys = await prisma.apikeys.update({
        where: { id },
        data: req.body,
      });
      res.status(200).json(apikeys);
    } catch (e) {
      res.status(500).json({ message: 'Something went wrong' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const apikeys = await prisma.apikeys.delete({
        where: { id },
      });
      res.status(200).json(apikeys);
    } catch (e) {
      res.status(500).json({ message: 'Something went wrong' });
    }
  }
  // HTTP method not supported!
  else {
    res.setHeader('Allow', ['PATCH', 'DELETE']);
    res
      .status(405)
      .json({ message: `HTTP method ${req.method} is not supported.` });
  }
}