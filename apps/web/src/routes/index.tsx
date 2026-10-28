import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@managementapp/ui';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Project Management App</h1>
        <p className="text-xl text-muted-foreground">
          Manage projects, assign tasks, track progress
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild>
          <Link to="/auth/sign-in">Sign In</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/auth/sign-up">Sign Up</Link>
        </Button>
      </div>
    </div>
  );
}
