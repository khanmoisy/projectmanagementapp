import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton } from '@managementapp/ui';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { getProjectsFn } from '~/server/fns/projects';
import type { Project } from '@managementapp/types';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjectsFn(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link to="/projects/new">New Project</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <p className="text-2xl font-bold">{projects?.length || 0}</p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : projects?.map((p: Project) => (
              <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="block p-4 border rounded hover:bg-accent">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.status}</div>
              </Link>
            ))}
            {(!isLoading && (!projects || projects.length === 0)) && <p className="text-muted-foreground">No projects yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
