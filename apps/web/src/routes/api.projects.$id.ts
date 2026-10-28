import { createAPIFileRoute } from '@tanstack/start/api';
import { db, project } from '@managementapp/db';
import { auth } from '~/lib/auth';
import { eq } from 'drizzle-orm';

export const APIRoute = createAPIFileRoute('/api/projects/$id')({
  GET: async ({ request, params }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    const [proj] = await db.select().from(project).where(eq(project.id, params.id));
    if (!proj || proj.ownerId !== session.user.id) return new Response('Forbidden', { status: 403 });
    return Response.json(proj);
  },
});
