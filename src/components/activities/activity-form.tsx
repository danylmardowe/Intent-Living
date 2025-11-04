'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/context/auth-context'
import {
  Activity,
  ActivityType,
  createActivity,
  durationOf,
  listActivityTypes,
} from '@/lib/activities'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated?: () => void
}

export default function ActivityForm({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [types, setTypes] = React.useState<ActivityType[]>([])
  const [loadingTypes, setLoadingTypes] = useState(false)

  const [title, setTitle] = useState('')
  const [typeId, setTypeId] = useState<string | undefined>(undefined)
  const [startAt, setStartAt] = useState<string>(() => new Date().toISOString().slice(0,16))
  const [endAt, setEndAt] = useState<string>(() => new Date().toISOString().slice(0,16))
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string>('') // free-form tags still allowed when logging
  const [energy, setEnergy] = useState<number>(5)
  const [mood, setMood] = useState<string>('')

  React.useEffect(() => {
    if (!user?.uid) return
    setLoadingTypes(true)
    listActivityTypes(user.uid).then(setTypes).finally(() => setLoadingTypes(false))
  }, [user?.uid])

  const selectedType = useMemo(
    () => types.find(t => t.id === typeId),
    [typeId, types]
  )

  React.useEffect(() => {
    if (!selectedType) return
    // Only set title/duration when empty or unchanged by user
    if (!title) setTitle(selectedType.title)
    if (selectedType.defaultDuration) {
      const start = new Date(startAt)
      const suggestedEnd = new Date(start.getTime() + selectedType.defaultDuration)
      setEndAt(suggestedEnd.toISOString().slice(0,16))
    }
    // Note: bank no longer provides default tags or emoji
    // Users can still add tags ad-hoc while logging if they want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.uid) return

    const start = new Date(startAt)
    const end = new Date(endAt)
    const dur = durationOf(start, end)

    const payload: Omit<Activity, 'id' | 'createdAt'> = {
      title: title || selectedType?.title || 'Activity',
      startAt: Timestamp.fromDate(start),
      endAt: Timestamp.fromDate(end),
      duration: dur,
      notes: notes || undefined,
      tags: tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      energyLevel: energy,
      mood: mood || undefined,
      source: 'manual',
    }

    await createActivity(user.uid, payload)
    toast({ title: 'Activity logged' })
    onOpenChange(false)
    onCreated?.()

    // light reset
    setTitle('')
    setTypeId(undefined)
    setNotes('')
    setTags('')
    setEnergy(5)
    setMood('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">From Bank (optional)</Label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger id="type">
                  <SelectValue placeholder={loadingTypes ? 'Loading…' : 'Choose reusable activity'} />
                </SelectTrigger>
                <SelectContent>
                  {types.map(t => (
                    <SelectItem key={t.id} value={t.id!}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Deep Work, Gym, Team Meeting" />
            </div>

            <div>
              <Label htmlFor="startAt">Start</Label>
              <Input id="startAt" type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="endAt">End</Label>
              <Input id="endAt" type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="focus, training, solo" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional details…" />
            </div>

            <div className="sm:col-span-2">
              <Label>Energy</Label>
              <div className="flex items-center gap-3">
                <Slider value={[energy]} min={0} max={10} step={1} onValueChange={(v) => setEnergy(v[0])} />
                <span className="w-8 text-right text-sm tabular-nums">{energy}</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="mood">Mood</Label>
              <Input id="mood" value={mood} onChange={e => setMood(e.target.value)} placeholder="e.g., motivated, tired" />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
