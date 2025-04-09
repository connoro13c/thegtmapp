import { Request, Response } from 'express';

export const getSegments = async (req: Request, res: Response) => {
  try {
    // TODO: Implement with Prisma
    res.status(200).json({ message: 'Get segments endpoint' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
};