import { createServerFn } from '@tanstack/react-start';
import { db, task, project, projectMember } from '@managementapp/db';
import { auth } from '~/lib/auth';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { updateTaskSchema } from '@managementapp/validation';

async function ensureTaskMembership(request: Request, taskId: string) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  const t = await db.select().from(task).where(eq(task.id, taskId));
  if (t.length === 0) throw new Error('Not found');
  const projectId = t[0].projectId;
  const p = await db.select().from(project).where(eq(project.id, projectId));
  if (p.length > 0 && p[0].ownerId === session.user.id) return { session, task: t[0] };
  const m = await db
    .select()
    .from(projectMember)
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, session.user.id)));
  if (m.length === 0) throw new Error('Forbidden');
  return { session, task: t[0] };
}

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
    deadline: z.string().datetime().optional().or(z.date().optional()),
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
      deadline: data.deadline ? new Date(data.deadline as string) : null,
      createdBy: session.user.id,
      position: 0,
    }).returning();
    return created;
  });

export const updateTaskFn = createServerFn({ method: 'POST' })
  .validator(z.object({
    id: z.string().uuid(),
    data: updateTaskSchema,
  }))
  .handler(async ({ data, request }) => {
    await ensureTaskMembership(request, data.id);
    const parsed = updateTaskSchema.parse(data.data);
    const updateData: any = { ...parsed, updatedAt: new Date() };
    if (parsed.deadline) {
      updateData.deadline = new Date(parsed.deadline as any);
    }
    const [updated] = await db.update(task).set(updateData).where(eq(task.id, data.id)).returning();
    return updated;
  });

export const deleteTaskFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, request }) => {
    await ensureTaskMembership(request, data.id);
    await db.delete(task).where(eq(task.id, data.id));
    return { success: true };
  });
