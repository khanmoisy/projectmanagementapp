import { createAPIFileRoute } from '@tanstack/start/api';
import { db, project } from '@managementapp/db';
import { auth } from '~/lib/auth';
import { eq } from 'drizzle-orm';

export const APIRoute = createAPIFileRoute('/api/projects')({
  GET: async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    const projects = await db.select().from(project).where(eq(project.ownerId, session.user.id));
    return Response.json(projects);
  },
  POST: async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    const body = await request.json();
    const [created] = await db.insert(project).values({
      ownerId: session.user.id,
      name: body.name,
      description: body.description,
      status: body.status || 'planning',
    }).returning();
    return Response.json(created);
  },
});
