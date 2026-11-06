import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@managementapp/ui';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getProjectFn } from '~/server/fns/projects';
import { updateProjectFn, deleteProjectFn } from '~/server/fns/projects';
import type { ProjectStatus } from '@managementapp/types';

const projectStatusOptions: ProjectStatus[] = ['planning', 'active', 'on_hold', 'completed', 'archived'];

export const Route = createFileRoute('/projects/$id/edit')({
  component: EditProject,
});

function EditProject() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('planning');
  const [deadline, setDeadline] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => getProjectFn({ data: { id } }),
  });

  const updateProject = useMutation({
    mutationFn: async (data: { name: string; description: string; status: ProjectStatus; deadline?: string }) => {
      return await updateProjectFn({ data: { id, data } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated');
      navigate({ to: '/projects/$id', params: { id } });
    },
    onError: () => toast.error('Failed to update project'),
  });

  const deleteProject = useMutation({
    mutationFn: async () => {
      return await deleteProjectFn({ data: { id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
      navigate({ to: '/projects' });
    },
    onError: () => toast.error('Failed to delete project'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProject.mutate({ name, description, status, deadline: deadline || undefined });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-8 bg-muted rounded w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectStatusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" disabled={updateProject.isPending}>
                {updateProject.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/projects/$id', params: { id } })}>
                Cancel
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-3">Danger Zone</p>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                  setIsDeleting(true);
                  deleteProject.mutate(undefined, {
                    onSettled: () => setIsDeleting(false),
                  });
                }
              }}
              disabled={deleteProject.isPending || isDeleting}
            >
              {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}