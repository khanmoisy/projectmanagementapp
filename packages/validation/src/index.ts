import { z } from 'zod';

export const projectStatusEnum = z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']);
export const projectMemberRoleEnum = z.enum(['owner', 'admin', 'member', 'viewer']);
export const taskStatusEnum = z.enum(['todo', 'in_progress', 'review', 'done']);
export const taskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  status: projectStatusEnum.optional(),
  deadline: z.string().datetime().optional().or(z.date().optional()),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  deadline: z.string().datetime().optional().or(z.date().optional()),
  position: z.number().int().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

export const addMemberSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: projectMemberRoleEnum.default('member'),
});

export const searchQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
