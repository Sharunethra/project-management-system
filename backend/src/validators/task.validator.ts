import { z } from 'zod';

export const taskPriorityEnum = z.enum(['Low', 'Medium', 'High'], {
  errorMap: () => ({ message: "Priority must be 'Low', 'Medium', or 'High'" }),
});

export const taskStatusEnum = z.enum(['Pending', 'In Progress', 'Completed'], {
  errorMap: () => ({ message: "Status must be 'Pending', 'In Progress', or 'Completed'" }),
});

export const createTaskSchema = z.object({
  projectId: z.string({ required_error: 'Project ID is required' }).uuid({ message: 'Invalid Project ID format' }),
  name: z
    .string({ required_error: 'Task name is required' })
    .trim()
    .min(1, { message: 'Task name cannot be empty' }),
  description: z.string().optional().nullable(),
  priority: taskPriorityEnum.optional().default('Medium'),
  status: taskStatusEnum.optional().default('Pending'),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid due date format (ISO 8601 expected)' })
    .optional()
    .nullable(),
});

export const updateTaskSchema = z.object({
  projectId: z.string().uuid({ message: 'Invalid Project ID format' }).optional(),
  name: z.string().trim().min(1, { message: 'Task name cannot be empty' }).optional(),
  description: z.string().optional().nullable(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid due date format (ISO 8601 expected)' })
    .optional()
    .nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
