import { createServerFn } from '@tanstack/react-start';
import { db, project, projectMember, user } from '@managementapp/db';
import { auth } from '~/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { updateProjectSchema, addMemberSchema } from '@managementapp/validation';

export const getProjectsFn = createServerFn({ method: 'GET' }).handler(async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  const projects = await db.select().from(project).where(eq(project.ownerId, session.user.id));
  return projects;
});

export const getProjectFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new Error('Unauthorized');
    const projects = await db.select().from(project).where(eq(project.id, data.id));
    if (projects.length === 0) throw new Error('Not found');
    if (projects[0].ownerId !== session.user.id) throw new Error('Forbidden');
    return projects[0];
  });

export const createProjectFn = createServerFn({ method: 'POST' })
  .validator(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).optional(),
    deadline: z.string().datetime().optional().or(z.date().optional()),
  }))
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new Error('Unauthorized');
    const [created] = await db.insert(project).values({
      ownerId: session.user.id,
      name: data.name,
      description: data.description,
      status: data.status || 'planning',
      deadline: data.deadline ? new Date(data.deadline as string) : null,
    }).returning();
    return created;
  });

export const updateProjectFn = createServerFn({ method: 'POST' })
  .validator(z.object({
    id: z.string().uuid(),
    data: updateProjectSchema,
  }))
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new Error('Unauthorized');
    const projects = await db.select().from(project).where(eq(project.id, data.id));
    if (projects.length === 0) throw new Error('Not found');
    if (projects[0].ownerId !== session.user.id) throw new Error('Forbidden');
    const parsed = updateProjectSchema.parse(data.data);
    const updateData: any = { ...parsed, updatedAt: new Date() };
    if (parsed.deadline) {
      updateData.deadline = new Date(parsed.deadline as any);
    }
    const [updated] = await db.update(project).set(updateData).where(eq(project.id, data.id)).returning();
    return updated;
  });

export const deleteProjectFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new Error('Unauthorized');
    const projects = await db.select().from(project).where(eq(project.id, data.id));
    if (projects.length === 0) throw new Error('Not found');
    if (projects[0].ownerId !== session.user.id) throw new Error('Forbidden');
    await db.delete(project).where(eq(project.id, data.id));
    return { success: true };
  });

export const getProjectMembersFn = createServerFn({ method: 'GET' })
  .validator(z.object({ projectId: z.string().uuid() }))
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new Error('Unauthorized');
    const p = await db.select().from(project).where(eq(project.id, data.projectId));
    if (p.length === 0) throw new Error('Not found');
    if (p[0].ownerId !== session.user.id) throw new Error('Forbidden');
    const members = await db
      .select({
        id: projectMember.id,
        projectId: projectMember.projectId,
        userId: projectMember.userId,
        role: projectMember.role,
        joinedAt: projectMember.joinedAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(projectMember)
      .innerJoin(user, eq(projectMember.userId, user.id))
      .where(eq(projectMember.projectId, data.projectId));
    return members;
  });

export const addProjectMemberFn = createServerFn({ method: 'POST' })
  .validator(addMemberSchema)
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new Error('Unauthorized');
    const p = await db.select().from(project).where(eq(project.id, data.projectId));
    if (p.length === 0) throw new Error('Not found');
    if (p[0].ownerId !== session.user.id) throw new Error('Forbidden');
    const [member] = await db.insert(projectMember).values({
      projectId: data.projectId,
      userId: data.userId,
      role: data.role,
    }).returning();
    return member;
  });

export const removeProjectMemberFn = createServerFn({ method: 'POST' })
  .validator(z.object({ projectId: z.string().uuid(), userId: z.string() }))
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new Error('Unauthorized');
    const p = await db.select().from(project).where(eq(project.id, data.projectId));
    if (p.length === 0) throw new Error('Not found');
    if (p[0].ownerId !== session.user.id) throw new Error('Forbidden');
    await db.delete(projectMember).where(and(eq(projectMember.projectId, data.projectId), eq(projectMember.userId, data.userId)));
    return { success: true };
  });

export const updateProjectMemberRoleFn = createServerFn({ method: 'POST' })
  .validator(z.object({
    projectId: z.string().uuid(),
    userId: z.string(),
    role: z.enum(['owner', 'admin', 'member', 'viewer']),
  }))
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new Error('Unauthorized');
    const p = await db.select().from(project).where(eq(project.id, data.projectId));
    if (p.length === 0) throw new Error('Not found');
    if (p[0].ownerId !== session.user.id) throw new Error('Forbidden');
    const [updated] = await db.update(projectMember)
      .set({ role: data.role })
      .where(and(eq(projectMember.projectId, data.projectId), eq(projectMember.userId, data.userId)))
      .returning();
    return updated;
  });
