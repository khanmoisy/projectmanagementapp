import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@managementapp/ui';
import '../styles/app.css';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
      <Toaster />
    </>
  );
}
