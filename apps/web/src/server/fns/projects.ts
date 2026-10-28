import { createServerFn } from '@tanstack/start/server';
import { db, project } from '@managementapp/db';
import { auth } from '~/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const getProjectsFn = createServerFn({ method: 'GET' }).handler(async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  const projects = await db.select().from(project).where(eq(project.ownerId, session.user.id));
  return projects;
});

export const createProjectFn = createServerFn({ method: 'POST' })
  .validator(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).optional(),
  }))
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new Error('Unauthorized');
    const [created] = await db.insert(project).values({
      ownerId: session.user.id,
      name: data.name,
      description: data.description,
      status: data.status || 'planning',
    }).returning();
    return created;
  });
