import { createAPIFileRoute } from '@tanstack/start/api';
import { db, task } from '@managementapp/db';
import { auth } from '~/lib/auth';
import { eq } from 'drizzle-orm';

export const APIRoute = createAPIFileRoute('/api/tasks')({
  GET: async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    if (!projectId) return Response.json([]);
    const tasks = await db.select().from(task).where(eq(task.projectId, projectId));
    return Response.json(tasks);
  },
  POST: async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    const body = await request.json();
    const [created] = await db.insert(task).values({
      projectId: body.projectId,
      title: body.title,
      description: body.description,
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      createdBy: session.user.id,
      position: body.position || 0,
    }).returning();
    return Response.json(created);
  },
});
