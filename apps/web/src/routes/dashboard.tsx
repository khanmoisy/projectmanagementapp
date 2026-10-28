import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@managementapp/ui';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const { data: projects } = useQuery({
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
            <p className="text-2xl font-bold">{projects?.length || 0}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {projects?.map((p: any) => (
              <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="block p-4 border rounded hover:bg-accent">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.status}</div>
              </Link>
            ))}
            {(!projects || projects.length === 0) && <p className="text-muted-foreground">No projects yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
