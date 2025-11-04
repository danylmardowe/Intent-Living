export type TaskStatus =
  | 'backlog'
  | 'scheduled'
  | 'in_progress'
  | 'blocked'
  | 'done'
  | 'archived'

export type Subtask = {
  id: string
  title: string
  weight: number // 0..100 (relative; we normalize)
  done: boolean
  createdAt?: any
}

export type Task = {
  id: string
  title: string
  description?: string
  status: TaskStatus
  importance: number
  urgency: number
  lifeAreaId?: string | null
  goalId?: string | null
  dueAt?: any
  startAt?: any
  done: boolean
  blockedReason?: string
  progress: number // 0..100
  createdAt?: any
  isActive?: boolean // <-- Add this line
}

export type LifeArea = {
  id: string
  name: string
  description?: string
  color?: string
  emoji?: string
  journalingCadence?: 'off' | 'daily' | 'weekly' | 'monthly' | 'custom'
}

export type Goal = {
  id: string
  title: string
  description?: string
  lifeAreaId?: string | null
  targetDate?: any
  isActive?: boolean // <-- Add this line
}

export type ActivityType = {
  id: string
  title: string
  defaultLifeAreaId?: string | null
}

export type Activity = {
  id: string
  title: string
  typeId: string
  lifeAreaId?: string | null
  // For generic activities these may be omitted:
  startTime?: Date | null
  endTime?: Date | null
  durationMinutes?: number | null
  notes?: string | null
  createdAt: Date
}

export type Objective = {
  id: string
  title: string
  cadence: 'daily' | 'weekly' | 'monthly' | 'six-monthly'
  status: 'active' | 'paused' | 'retired'
  lifeAreaId?: string | null
  goalId?: string | null
}

export type TriStatus = 'yes' | 'partial' | 'no' | null