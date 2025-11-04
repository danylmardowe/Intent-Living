// src/components/tasks/task-form.tsx
'use client'

import { useMemo, ChangeEvent } from 'react'
import { useUserCollection } from '@/lib/useUserCollection'
import { LifeArea, Goal, Task, TaskStatus } from '@/lib/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
]

type TaskFormData = Partial<Task>

interface TaskFormProps {
  formData: TaskFormData
  onFormChange: (fieldName: keyof TaskFormData, value: any) => void
}

export default function TaskForm({ formData, onFormChange }: TaskFormProps) {
  const { data: lifeAreas } = useUserCollection<LifeArea>('lifeAreas', 'name')
  const { data: goals } = useUserCollection<Goal>('goals', 'title')

  const areaOptions = useMemo(() => lifeAreas.map(a => ({ id: a.id, name: a.name })), [lifeAreas])
  const goalOptions = useMemo(() => goals.map(g => ({ id: g.id, title: g.title })), [goals])

  // Helper to handle date conversion for input fields
  const formatDateForInput = (date: any): string => {
    if (!date) return ''
    const d = date instanceof Date ? date : date.toDate()
    return d.toISOString().split('T')[0]
  }

  return (
    <div className="grid gap-4 py-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onFormChange('title', e.target.value)}
          placeholder="e.g., Plan weekly workout schedule"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onFormChange('description', e.target.value)}
          rows={3}
          placeholder="Add more details..."
        />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={formData.status || 'backlog'}
          onValueChange={(v) => onFormChange('status', v as TaskStatus)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Life Area</Label>
        <Select
          value={formData.lifeAreaId || 'none'}
          onValueChange={(v) => onFormChange('lifeAreaId', v === 'none' ? null : v)}
        >
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {areaOptions.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Goal</Label>
        <Select
          value={formData.goalId || 'none'}
          onValueChange={(v) => onFormChange('goalId', v === 'none' ? null : v)}
        >
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {goalOptions.map(g => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Start date</Label>
        <Input
          id="startDate"
          type="date"
          value={formatDateForInput(formData.startAt)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onFormChange('startAt', e.target.value ? new Date(e.target.value) : null)}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="dueDate">Due date</Label>
        <Input
          id="dueDate"
          type="date"
          value={formatDateForInput(formData.dueAt)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onFormChange('dueAt', e.target.value ? new Date(e.target.value) : null)}
        />
      </div>

      <div className="space-y-2">
        <Label>Importance: {formData.importance ?? 50}</Label>
        <Slider
          value={[formData.importance ?? 50]}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => onFormChange('importance', v[0])}
        />
      </div>
      <div className="space-y-2">
        <Label>Urgency: {formData.urgency ?? 40}</Label>
        <Slider
          value={[formData.urgency ?? 40]}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => onFormChange('urgency', v[0])}
        />
      </div>
    </div>
  )
}