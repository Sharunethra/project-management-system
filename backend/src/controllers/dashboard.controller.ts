import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
      recentProjects,
      recentTasks,
    ] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'Completed' } }),
      prisma.task.count({ where: { userId, status: 'Pending' } }),
      prisma.project.count({ where: { userId, status: 'In Progress' } }),
      prisma.project.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: { name: true },
          },
        },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        projectsInProgress,
        recentProjects,
        recentTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};
