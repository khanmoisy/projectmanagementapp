import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@managementapp/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/projects/$id')({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [taskTitle, setTaskTitle] = useState('');

  const { data: project } = useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?projectId=${id}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const createTask = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId: id }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      setTaskTitle('');
      toast.success('Task created');
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: any) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{project?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{project?.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="New task..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
            <Button onClick={() => createTask.mutate({ title: taskTitle })} disabled={!taskTitle}>Add Task</Button>
          </div>
          <div className="space-y-2">
            {tasks?.map((task: any) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-muted-foreground">{task.status} • {task.priority}</div>
                </div>
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus.mutate({ taskId: task.id, status: e.target.value })}
                  className="border rounded px-2 py-1"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
