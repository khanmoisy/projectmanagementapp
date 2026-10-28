import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@managementapp/ui';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/projects/')({
  component: ProjectsList,
});

function ProjectsList() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button asChild>
          <Link to="/projects/new">New Project</Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-2">
              {projects?.map((p: any) => (
                <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="block p-4 border rounded hover:bg-accent">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.description}</div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
