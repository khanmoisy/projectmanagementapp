import { createFileRoute, Outlet, Link } from '@tanstack/react-router';
import { authClient, signOut } from '~/lib/auth-client';
import { redirect } from '@tanstack/react-router';
import { Button } from '@managementapp/ui';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      throw redirect({ to: '/auth/sign-in' });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth/sign-in';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold">Project Management</Link>
          <div className="flex items-center gap-4">
            <Link to="/projects" className="text-sm hover:underline">Projects</Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}