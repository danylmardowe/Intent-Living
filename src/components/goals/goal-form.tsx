// src/components/goals/goal-form.tsx
'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'

export type GoalLite = {
  id: string
  title: string
  parentId?: string | null
}

export type AreaLite = { id: string; name: string }

export type GoalFormValues = {
  title: string
  description: string
  parentId: string | 'none'
  lifeAreaId: string | 'none'
  progressMethod: 'manual' | 'auto'
  progress: number
  status: 'active' | 'paused' | 'completed'
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function computeDescendants(rootId: string, all: GoalLite[]) {
  const byParent = new Map<string, string[]>()
  all.forEach(g => {
    if (g.parentId) {
      const arr = byParent.get(g.parentId) ?? []
      arr.push(g.id)
      byParent.set(g.parentId, arr)
    }
  })
  const out = new Set<string>()
  const stack = [rootId]
  while (stack.length) {
    const id = stack.pop()!
    const kids = byParent.get(id) ?? []
    for (const k of kids) {
      if (!out.has(k)) {
        out.add(k)
        stack.push(k)
      }
    }
  }
  return out
}

export default function GoalForm({
  open,
  onOpenChange,
  allGoals,
  areas,
  initialValues,
  editingGoalId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  allGoals: GoalLite[]
  areas: AreaLite[]
  initialValues: GoalFormValues | null
  editingGoalId: string | null
  onSubmit: (values: GoalFormValues) => Promise<void> | void
}) {
  const isEdit = !!editingGoalId
  const [values, setValues] = React.useState<GoalFormValues>(
    initialValues ?? {
      title: '',
      description: '',
      parentId: 'none',
      lifeAreaId: 'none',
      progressMethod: 'manual',
      progress: 0,
      status: 'active',
    }
  )

  React.useEffect(() => {
    if (initialValues) setValues(initialValues)
  }, [initialValues, open])

  const blockedParents = React.useMemo(() => {
    if (!editingGoalId) return new Set<string>()
    return computeDescendants(editingGoalId, allGoals)
  }, [editingGoalId, allGoals])

  const parentOptions = React.useMemo(() => {
    return allGoals
      .filter(g => g.id !== editingGoalId && !blockedParents.has(g.id))
      .map(g => ({ id: g.id, title: g.title }))
  }, [allGoals, editingGoalId, blockedParents])

  function set<K extends keyof GoalFormValues>(k: K, v: GoalFormValues[K]) {
    setValues(prev => ({ ...prev, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Goal title"
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label>Parent goal</Label>
            <Select
              value={values.parentId}
              onValueChange={(v) => set('parentId', v as any)}
            >
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {parentOptions.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && blockedParents.size > 0 && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">Self/descendants hidden</Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Life Area</Label>
            <Select
              value={values.lifeAreaId}
              onValueChange={(v) => set('lifeAreaId', v as any)}
            >
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {areas.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Progress method</Label>
            <Select
              value={values.progressMethod}
              onValueChange={(v) => set('progressMethod', v as 'manual' | 'auto')}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="auto">Auto (from children & tasks)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={values.status}
              onValueChange={(v) => set('status', v as any)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {values.progressMethod === 'manual' && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Progress: {Math.round(values.progress)}%</Label>
              <Slider
                value={[values.progress]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => set('progress', clamp(v[0] ?? 0, 0, 100))}
              />
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? 'Save changes' : 'Create goal'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
