export type LifeArea = {
  id: string;
  name: string;
  vision: string;
  guidingPrinciples: string[];
  kpis: { name: string; value: string }[];
  journalingCadence: 'daily' | 'weekly' | 'monthly' | 'off';
  parentAreaId?: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type Goal = {
  id: string;
  title: string;
  description: string;
  type: 'project' | 'microProject' | 'goal' | 'microGoal';
  status: 'not-started' | 'in-progress' | 'completed' | 'paused';
  lifeAreaId: string;
  parentGoalId?: string;
  progress: number;
  progressMethod: 'auto' | 'manual';
  isObjective: boolean;
  objectiveCadence?: 'daily' | 'weekly' | 'monthly';
  children?: Goal[];
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'scheduled' | 'today' | 'in-progress' | 'blocked' | 'done' | 'archived';
  dueAt: string;
  startAt: string;
  importance: number;
  urgency: number;
  progress: number;
  goalId?: string;
  lifeAreaId: string;
};

export type Objective = {
  id: string;
  title: string;
  cadence: 'daily' | 'weekly' | 'monthly' | 'sixMonthly';
  lifeAreaId?: string;
  goalId?: string;
  status: 'active' | 'paused' | 'retired';
};

export type Mindset = {
  id: string;
  affirmation: string;
};

export type Attitude = {
  id: string;
  tone: string;
};

export type Mode = {
  id: string;
  name: string;
  mindsets: Mindset[];
  attitudes: Attitude[];
  activeLifeAreaIds: string[];
  duration: 'weekly' | 'monthly';
  isActive: boolean;
};

export type Activity = {
  id: string;
  name: string;
  startTime: string;
  duration: string;
  lifeAreaId?: string;
  goalId?: string;
};
