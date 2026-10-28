import { createAPIFileRoute } from '@tanstack/start/api';
import { db, task } from '@managementapp/db';
import { auth } from '~/lib/auth';
import { eq } from 'drizzle-orm';

export const APIRoute = createAPIFileRoute('/api/tasks/$id')({
  PUT: async ({ request, params }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    const body = await request.json();
    const [updated] = await db.update(task).set({ ...body, updatedAt: new Date() }).where(eq(task.id, params.id)).returning();
    return Response.json(updated);
  },
  DELETE: async ({ request, params }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    await db.delete(task).where(eq(task.id, params.id));
    return new Response('OK', { status: 200 });
  },
});
