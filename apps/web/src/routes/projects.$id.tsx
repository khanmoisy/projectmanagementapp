import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Label, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Avatar, AvatarFallback } from '@managementapp/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { getProjectFn } from '~/server/fns/projects';
import { getTasksFn, createTaskFn, updateTaskFn, deleteTaskFn } from '~/server/fns/tasks';
import { getProjectMembersFn, addProjectMemberFn, removeProjectMemberFn, updateProjectMemberRoleFn } from '~/server/fns/projects';
import { computeProgress, formatDate } from '@managementapp/utils';
import { z } from 'zod';
import type { Task, TaskStatus, TaskPriority, ProjectMemberRole } from '@managementapp/types';

const searchSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  assigneeId: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

const taskStatusOptions: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
const taskPriorityOptions: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const memberRoleOptions: ProjectMemberRole[] = ['admin', 'member', 'viewer'];

export const Route = createFileRoute('/projects/$id')({
  validateSearch: searchSchema,
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const [taskTitle, setTaskTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ProjectMemberRole>('member');

  const { data: project } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => getProjectFn({ data: { id } }),
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => getTasksFn({ data: { projectId: id } }),
  });

  const { data: members } = useQuery({
    queryKey: ['project-members', id],
    queryFn: () => getProjectMembersFn({ data: { projectId: id } }),
  });

  const filteredTasks = (tasks || [])
    .filter((t: Task) => {
      if (search.status && t.status !== search.status) return false;
      if (search.assigneeId && t.assigneeId !== search.assigneeId) return false;
      if (search.q && !t.title.toLowerCase().includes(search.q.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const total = filteredTasks.length;
  const start = (search.page - 1) * search.limit;
  const pagedTasks = filteredTasks.slice(start, start + search.limit);

  const doneCount = (tasks || []).filter((t: Task) => t.status === 'done').length;
  const totalCount = (tasks || []).length;
  const progress = computeProgress(doneCount, totalCount);

  const createTask = useMutation({
    mutationFn: async (data: { title: string; deadline?: string; assigneeId?: string }) => {
      return await createTaskFn({ data: { ...data, projectId: id, deadline: data.deadline, assigneeId: data.assigneeId || undefined } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      setTaskTitle('');
      setDeadline('');
      setAssigneeId('');
      toast.success('Task created');
    },
    onError: () => toast.error('Failed to create task'),
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: Partial<Task> }) => {
      return await updateTaskFn({ data: { id: taskId, data } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
    onError: () => toast.error('Failed to update task'),
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      return await deleteTaskFn({ data: { id: taskId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      toast.success('Task deleted');
    },
    onError: () => toast.error('Failed to delete task'),
  });

  const addMember = useMutation({
    mutationFn: async (data: { projectId: string; userId: string; role: ProjectMemberRole }) => {
      return await addProjectMemberFn({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      setNewMemberEmail('');
      toast.success('Member added');
    },
    onError: () => toast.error('Failed to add member'),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      return await removeProjectMemberFn({ data: { projectId: id, userId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      toast.success('Member removed');
    },
    onError: () => toast.error('Failed to remove member'),
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: ProjectMemberRole }) => {
      return await updateProjectMemberRoleFn({ data: { projectId: id, userId, role } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', id] });
      toast.success('Role updated');
    },
    onError: () => toast.error('Failed to update role'),
  });

  const setStatusFilter = (status?: string) => {
    navigate({ search: (prev) => ({ ...prev, status, page: 1 }) });
  };

  const setAssigneeFilter = (assigneeId?: string) => {
    navigate({ search: (prev) => ({ ...prev, assigneeId, page: 1 }) });
  };

  const setSearch = (q: string) => {
    navigate({ search: (prev) => ({ ...prev, q, page: 1 }) });
  };

  const setPage = (page: number) => {
    navigate({ search: (prev) => ({ ...prev, page }) });
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask.mutate({ taskId, data: { status } });
  };

  const handlePriorityChange = (taskId: string, priority: TaskPriority) => {
    updateTask.mutate({ taskId, data: { priority } });
  };

  const handleAssigneeChange = (taskId: string, assigneeId: string) => {
    updateTask.mutate({ taskId, data: { assigneeId: assigneeId || null } });
  };

  const uniqueAssignees = [...new Set((tasks || []).map((t) => t.assigneeId).filter(Boolean))] as string[];

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd look up the user by email
    // For now, we'll use the email as userId (demo purposes)
    addMember.mutate({ projectId: id, userId: newMemberEmail, role: newMemberRole });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project?.name}</h1>
          <p className="text-muted-foreground">{project?.description}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/projects/$id/edit" params={{ id }}>
            <Button variant="outline">Edit Project</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Progress</span>
                  <span className="text-sm">{progress}%</span>
                </div>
                <div className="w-64 bg-secondary h-2 rounded">
                  <div className="bg-primary h-2 rounded" style={{ width: progress + '%' }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{project?.status.replace('_', ' ')}</Badge>
                {project?.deadline && (
                  <Badge variant="outline">Due: {formatDate(project.deadline)}</Badge>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {totalCount} task(s) • {doneCount} done
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
          <TabsTrigger value="members" className="flex-1">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Input placeholder="New task..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="max-w-xs" />
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="border rounded px-2 py-1"
                />
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {uniqueAssignees.map((userId) => (
                      <SelectItem key={userId} value={userId}>User {userId.slice(0, 8)}</SelectItem>
                    ))}
                    {(members || []).map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>{m.userName} ({m.userEmail})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => createTask.mutate({ title: taskTitle, deadline: deadline || undefined, assigneeId: assigneeId || undefined })} disabled={!taskTitle}>
                  Add Task
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Search tasks..."
                  value={search.q || ''}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
                <Select value={search.status || ''} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {taskStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={search.assigneeId || ''} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {uniqueAssignees.map((userId) => (
                      <SelectItem key={userId} value={userId}>User {userId.slice(0, 8)}</SelectItem>
                    ))}
                    {(members || []).map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>{m.userName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {pagedTasks?.map((task: Task) => (
                  <div key={task.id} className="flex flex-wrap items-center justify-between p-3 border rounded gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{task.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {task.status} • {task.priority}
                        {task.deadline ? ` • Due: ${formatDate(task.deadline)}` : ''}
                        {task.assigneeId ? ` • Assigned: ${task.assigneeId.slice(0, 8)}` : ' • Unassigned'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select value={task.status} onValueChange={(status) => handleStatusChange(task.id, status as TaskStatus)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taskStatusOptions.map((status) => (
                            <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={task.priority} onValueChange={(priority) => handlePriorityChange(task.id, priority as TaskPriority)}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taskPriorityOptions.map((priority) => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={task.assigneeId || ''} onValueChange={(assigneeId) => handleAssigneeChange(task.id, assigneeId)}>
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Assign" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {uniqueAssignees.map((userId) => (
                            <SelectItem key={userId} value={userId}>User {userId.slice(0, 8)}</SelectItem>
                          ))}
                          {(members || []).map((m) => (
                            <SelectItem key={m.userId} value={m.userId}>{m.userName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="destructive" size="sm" onClick={() => deleteTask.mutate(task.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
                {(!pagedTasks || pagedTasks.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No tasks found. Create one above!</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {search.page} of {Math.max(1, Math.ceil(total / search.limit))} • {total} task(s) total
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={search.page <= 1} onClick={() => setPage(search.page - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={search.page * search.limit >= total} onClick={() => setPage(search.page + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddMember} className="flex flex-wrap gap-2 items-end">
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <Label htmlFor="member-email">Add Member (Email)</Label>
                  <Input
                    id="member-email"
                    type="email"
                    placeholder="user@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="member-role">Role</Label>
                  <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                    <SelectTrigger id="member-role" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {memberRoleOptions.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={addMember.isPending || !newMemberEmail}>
                  {addMember.isPending ? 'Adding...' : 'Add Member'}
                </Button>
              </form>

              <div className="space-y-2">
                {members?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{member.userName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.userName}</div>
                        <div className="text-sm text-muted-foreground">{member.userEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role !== 'owner' && (
                        <>
                          <Select value={member.role} onValueChange={(role) => updateMemberRole.mutate({ userId: member.userId, role: role as ProjectMemberRole })}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {memberRoleOptions.map((role) => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                              ))}
                            </SelectContent                          >
                          </Select>
                          <Button variant="destructive" size="sm" onClick={() => removeMember.mutate(member.userId)}>
                            Remove
                          </Button>
                        </>
                      )}
                      {member.role === 'owner' && (
                        <Badge variant="secondary">Owner</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {(!members || members.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No members yet. Add some above!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}