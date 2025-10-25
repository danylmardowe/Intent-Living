import type { LifeArea, Goal, Task, Objective, Mode, Mindset, Attitude, Activity } from './types';
import { Heart, Briefcase, BrainCircuit, Target, BookOpen, Dumbbell, DollarSign } from 'lucide-react';

export const lifeAreas: LifeArea[] = [
  {
    id: 'health',
    name: 'Health & Fitness',
    vision: 'To be physically and mentally strong, energetic, and resilient.',
    guidingPrinciples: ['Consistency over intensity', 'Listen to my body', 'Nourish, don\'t restrict'],
    kpis: [{ name: 'Weekly Workouts', value: '4' }, { name: 'Sleep', value: '7-8 hours' }],
    journalingCadence: 'daily',
    icon: Dumbbell,
  },
  {
    id: 'career',
    name: 'Career & Work',
    vision: 'To build a fulfilling career that leverages my strengths and provides financial stability.',
    guidingPrinciples: ['Always be learning', 'Deliver value', 'Build strong relationships'],
    kpis: [{ name: 'Projects Completed', value: '5' }],
    journalingCadence: 'weekly',
    icon: Briefcase,
  },
  {
    id: 'personal-growth',
    name: 'Personal Growth',
    vision: 'To continuously learn, expand my skills, and cultivate a growth mindset.',
    guidingPrinciples: ['Embrace challenges', 'Read widely', 'Practice self-reflection'],
    kpis: [{ name: 'Books Read', value: '12/year' }],
    journalingCadence: 'daily',
    icon: BookOpen,
  },
  {
    id: 'finance',
    name: 'Financials',
    vision: 'To achieve financial independence and security.',
    guidingPrinciples: ['Spend less than I earn', 'Invest wisely', 'Automate savings'],
    kpis: [{ name: 'Savings Rate', value: '25%' }],
    journalingCadence: 'monthly',
    icon: DollarSign,
  }
];

export const goals: Goal[] = [
  {
    id: 'g1',
    title: 'Launch LDM System MVP',
    description: 'Complete and launch the Minimum Viable Product for the Lifeline system.',
    type: 'project',
    status: 'in-progress',
    lifeAreaId: 'career',
    progress: 60,
    progressMethod: 'auto',
    isObjective: true,
    objectiveCadence: 'monthly',
    children: [
      {
        id: 'g2',
        title: 'Develop Core Modules',
        description: 'Build out all core modules as defined in the spec.',
        type: 'microProject',
        status: 'in-progress',
        lifeAreaId: 'career',
        parentGoalId: 'g1',
        progress: 75,
        progressMethod: 'auto',
        isObjective: false,
        children: [
          {
            id: 'g3',
            title: 'Implement Task Management',
            description: 'Create the tasks module with all specified views.',
            type: 'goal',
            status: 'completed',
            lifeAreaId: 'career',
            parentGoalId: 'g2',
            progress: 100,
            progressMethod: 'manual',
            isObjective: false,
          },
          {
            id: 'g4',
            title: 'Implement Daily Review',
            description: 'Create the daily review workflow.',
            type: 'goal',
            status: 'in-progress',
            lifeAreaId: 'career',
            parentGoalId: 'g2',
            progress: 50,
            progressMethod: 'manual',
            isObjective: false,
          },
        ]
      },
    ]
  },
  {
    id: 'g5',
    title: 'Improve Physical Fitness',
    description: 'Focus on strength training and cardiovascular health.',
    type: 'project',
    status: 'in-progress',
    lifeAreaId: 'health',
    progress: 40,
    progressMethod: 'manual',
    isObjective: true,
    objectiveCadence: 'monthly',
  }
];

export const tasks: Task[] = [
  {
    id: 't1',
    title: 'Design database schema',
    description: 'Define Firestore collections and data models.',
    status: 'done',
    dueAt: '2024-07-20',
    startAt: '2024-07-18',
    importance: 90,
    urgency: 95,
    progress: 100,
    goalId: 'g3',
    lifeAreaId: 'career',
  },
  {
    id: 't2',
    title: 'Build UI for Eisenhower Matrix',
    description: 'Create the 2x2 grid view for tasks.',
    status: 'in-progress',
    dueAt: '2024-07-25',
    startAt: '2024-07-22',
    importance: 80,
    urgency: 85,
    progress: 50,
    goalId: 'g3',
    lifeAreaId: 'career',
  },
    {
    id: 't3',
    title: 'Weekly grocery shopping',
    description: 'Buy healthy food for the week.',
    status: 'scheduled',
    dueAt: '2024-07-28',
    startAt: '2024-07-28',
    importance: 70,
    urgency: 30,
    progress: 0,
    lifeAreaId: 'health',
  },
  {
    id: 't4',
    title: 'Pay credit card bill',
    description: 'Avoid late fees.',
    status: 'today',
    dueAt: '2024-07-24',
    startAt: '2024-07-24',
    importance: 40,
    urgency: 90,
    progress: 0,
    lifeAreaId: 'finance',
  },
   {
    id: 't5',
    title: 'Read "Atomic Habits"',
    description: 'Finish the book on building good habits.',
    status: 'backlog',
    dueAt: '2024-08-30',
    startAt: '2024-08-01',
    importance: 60,
    urgency: 20,
    progress: 10,
    lifeAreaId: 'personal-growth',
  },
];

export const objectives: Objective[] = [
  {
    id: 'o1',
    title: 'Complete Daily Review',
    cadence: 'daily',
    status: 'active',
    lifeAreaId: 'personal-growth'
  },
  {
    id: 'o2',
    title: 'Workout for at least 30 minutes',
    cadence: 'daily',
    status: 'active',
    lifeAreaId: 'health'
  },
  {
    id: 'o3',
    title: 'Review progress on LDM MVP',
    cadence: 'weekly',
    status: 'active',
    lifeAreaId: 'career'
  },
  {
    id: 'o4',
    title: 'Set new monthly goals',
    cadence: 'monthly',
    status: 'active',
  }
];

const mindsets: Mindset[] = [
  { id: 'm1', affirmation: 'I am focused and productive.' },
  { id: 'm2', affirmation: 'I am calm and present.' },
  { id: 'm3', affirmation: 'Every day is a new opportunity for growth.' },
];

const attitudes: Attitude[] = [
  { id: 'a1', tone: 'Creative' },
  { id: 'a2', tone: 'Disciplined' },
  { id: 'a3', tone: 'Relaxed' },
];

export const modes: Mode[] = [
  {
    id: 'mode1',
    name: 'Deep Work',
    mindsets: [mindsets[0], mindsets[1]],
    attitudes: [attitudes[1]],
    activeLifeAreaIds: ['career', 'personal-growth'],
    duration: 'weekly',
    isActive: true,
  },
  {
    id: 'mode2',
    name: 'Recharge & Reflect',
    mindsets: [mindsets[1], mindsets[2]],
    attitudes: [attitudes[2]],
    activeLifeAreaIds: ['health', 'personal-growth'],
    duration: 'monthly',
    isActive: false,
  }
];

export const activities: Activity[] = [
    { id: 'act1', name: 'Morning workout', startTime: '7:00 AM', duration: '45 mins', lifeAreaId: 'health' },
    { id: 'act2', name: 'Team standup', startTime: '9:00 AM', duration: '15 mins', lifeAreaId: 'career' },
    { id: 'act3', name: 'Coding session', startTime: '9:15 AM', duration: '3 hours', lifeAreaId: 'career', goalId: 'g4' },
    { id: 'act4', name: 'Lunch break', startTime: '12:15 PM', duration: '1 hour' },
];
