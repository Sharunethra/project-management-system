import { z } from 'zod';

export const projectStatusEnum = z.enum(['Not Started', 'In Progress', 'Completed'], {
  errorMap: () => ({ message: "Status must be 'Not Started', 'In Progress', or 'Completed'" }),
});

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .trim()
    .min(1, { message: 'Project name cannot be empty' }),
  description: z.string().optional().nullable(),
  status: projectStatusEnum.optional().default('Not Started'),
  startDate: z
    .string()
    .datetime({ message: 'Invalid start date format (ISO 8601 expected)' })
    .optional()
    .nullable(),
  endDate: z
    .string()
    .datetime({ message: 'Invalid end date format (ISO 8601 expected)' })
    .optional()
    .nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, { message: 'Project name cannot be empty' }).optional(),
  description: z.string().optional().nullable(),
  status: projectStatusEnum.optional(),
  startDate: z
    .string()
    .datetime({ message: 'Invalid start date format (ISO 8601 expected)' })
    .optional()
    .nullable(),
  endDate: z
    .string()
    .datetime({ message: 'Invalid end date format (ISO 8601 expected)' })
    .optional()
    .nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
