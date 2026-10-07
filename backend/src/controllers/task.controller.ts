import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId, search, status, priority, page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId, // Strict ownership check
    };

    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    if (status && typeof status === 'string' && status.trim() !== '') {
      where.status = status.trim();
    }

    if (priority && typeof priority === 'string' && priority.trim() !== '') {
      where.priority = priority.trim();
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      data: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId, // Strict ownership check
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({
        status: 'error',
        message: 'Task not found or you do not have permission to access it',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId, name, description, priority, status, dueDate } = req.body;

    // Verify user owns the target project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      res.status(404).json({
        status: 'error',
        message: 'Associated project not found or you do not have permission to add tasks to it',
      });
      return;
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        priority: priority || 'Medium',
        status: status || 'Pending',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { projectId, name, description, priority, status, dueDate } = req.body;

    // Check ownership of the task
    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      res.status(404).json({
        status: 'error',
        message: 'Task not found or you do not have permission to modify it',
      });
      return;
    }

    // If changing projectId, verify ownership of the new project
    if (projectId && projectId !== existingTask.projectId) {
      const targetProject = await prisma.project.findFirst({
        where: { id: projectId, userId },
      });
      if (!targetProject) {
        res.status(404).json({
          status: 'error',
          message: 'Target project not found or you do not have permission to access it',
        });
        return;
      }
    }

    const updateData: any = {};
    if (projectId !== undefined) updateData.projectId = projectId;
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({
        status: 'error',
        message: 'Task not found or you do not have permission to delete it',
      });
      return;
    }

    await prisma.task.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
