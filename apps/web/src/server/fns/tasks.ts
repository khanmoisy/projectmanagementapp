import { createServerFn } from '@tanstack/start/server';
import { db, task } from '@managementapp/db';
import { auth } from '~/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const getTasksFn = createServerFn({ method: 'GET' })
  .validator(z.object({ projectId: z.string().uuid() }))
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new Error('Unauthorized');
    const tasks = await db.select().from(task).where(eq(task.projectId, data.projectId));
    return tasks;
  });

export const createTaskFn = createServerFn({ method: 'POST' })
  .validator(z.object({
    projectId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }))
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new Error('Unauthorized');
    const [created] = await db.insert(task).values({
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      createdBy: session.user.id,
      position: 0,
    }).returning();
    return created;
  });
