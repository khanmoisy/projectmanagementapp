import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, Button, Skeleton } from '@managementapp/ui';
import { useQuery } from '@tanstack/react-query';
import { getProjectsFn } from '~/server/fns/projects';
import type { Project } from '@managementapp/types';

export const Route = createFileRoute('/projects/')({
  component: ProjectsList,
});

function ProjectsList() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjectsFn(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button asChild>
          <Link to="/projects/new">New Project</Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))
          ) : (
            <div className="space-y-2">
              {projects?.map((p: Project) => (
                <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="block p-4 border rounded hover:bg-accent">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.description}</div>
                </Link>
              ))}
              {(!isLoading && (!projects || projects.length === 0)) && <p className="text-muted-foreground">No projects yet. Create one to get started!</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
