export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

export type Project = {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  deadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: Date;
};

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type Task = {
  id: string;
  projectId: string;
  assigneeId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: Date | null;
  position: number;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectWithStats = Project & {
  taskCount: number;
  doneCount: number;
  progress: number; // 0-100
};
