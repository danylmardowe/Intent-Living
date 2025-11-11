// src/components/activities/activity-form.tsx
'use client'

import * as React from 'react'
import { useMemo, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/context/auth-context'
import {
  Activity,
  ActivityType,
  createActivity,
  durationOf,
  listActivityTypes,
} from '@/lib/activities'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'

export type ActivityFormProps = {
  /** Called after a successful create */
  onSuccess?: () => void
  /** Optional initial values to prefill the form (journal extraction flow) */
  initial?: {
    title?: string
    durationMins?: number
    notes?: string
    energy?: number // 0..10
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function setHM(base: Date, h: number, m: number) {
  const d = new Date(base)
  d.setHours(h, m, 0, 0)
  return d
}

export default function ActivityForm({ onSuccess, initial }: ActivityFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [types, setTypes] = React.useState<ActivityType[]>([])
  const [loadingTypes, setLoadingTypes] = useState(false)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [typeId, setTypeId] = useState<string | undefined>(undefined)

  // Dates
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(() => {
    const now = new Date()
    const dur = (initial?.durationMins ?? 15) * 60_000
    return new Date(now.getTime() + dur)
  })
  // Times
  const [startHour, setStartHour] = useState<number>(new Date().getHours())
  const [startMinute, setStartMinute] = useState<number>(Math.floor(new Date().getMinutes() / 5) * 5)
  const [endHour, setEndHour] = useState<number>(clamp(new Date().getHours() + 1, 0, 23))
  const [endMinute, setEndMinute] = useState<number>(startMinute)

  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [energy, setEnergy] = useState<number>(initial?.energy ?? 5)
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

  // If the selected ActivityType has a default duration, prefill end time
  React.useEffect(() => {
    if (!selectedType) return
    if (!title) setTitle(selectedType.title)

    if (selectedType.defaultDuration && selectedType.defaultDuration > 0) {
      const start = setHM(startDate, startHour, startMinute)
      const end = new Date(start.getTime() + selectedType.defaultDuration)
      setEndDate(end)
      setEndHour(end.getHours())
      setEndMinute(end.getMinutes())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType])

  function startDateTime() {
    return setHM(startDate, startHour, startMinute)
  }
  function endDateTime() {
    return setHM(endDate, endHour, endMinute)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.uid) return

    let start = startDateTime()
    let end = endDateTime()

    if (end <= start) {
      end = new Date(start.getTime() + 15 * 60 * 1000)
    }

    const dur = durationOf(start, end)

    const payload: Omit<Activity, 'id' | 'createdAt'> = {
      title: title || selectedType?.title || 'Activity',
      startAt: Timestamp.fromDate(start),
      endAt: Timestamp.fromDate(end),
      duration: dur,
      notes: notes || undefined,
      energyLevel: energy,
      mood: mood || undefined,
      source: 'manual',
    }

    await createActivity(user.uid, payload)
    toast({ title: 'Activity logged' })
    onSuccess?.()

    // Reset (keep dates as convenience)
    setTitle('')
    setTypeId(undefined)
    setNotes('')
    setEnergy(5)
    setMood('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Deep Work, Gym" />
        </div>

        {/* Start Date + Time */}
        <div className="sm:col-span-1">
          <Label>Start</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => d && setStartDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Start time</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="w-full">
                <Label className="text-xs">Hour: {startHour.toString().padStart(2, '0')}</Label>
                <Slider min={0} max={23} step={1} value={[startHour]} onValueChange={v => setStartHour(v[0])} />
              </div>
              <div className="w-full">
                <Label className="text-xs">Minute: {startMinute.toString().padStart(2, '0')}</Label>
                <Slider min={0} max={55} step={5} value={[startMinute]} onValueChange={v => setStartMinute(v[0])} />
              </div>
            </div>
          </div>
        </div>

        {/* End Date + Time */}
        <div className="sm:col-span-1">
          <Label>End</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => d && setEndDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>End time</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="w-full">
                <Label className="text-xs">Hour: {endHour.toString().padStart(2, '0')}</Label>
                <Slider min={0} max={23} step={1} value={[endHour]} onValueChange={v => setEndHour(v[0])} />
              </div>
              <div className="w-full">
                <Label className="text-xs">Minute: {endMinute.toString().padStart(2, '0')}</Label>
                <Slider min={0} max={55} step={5} value={[endMinute]} onValueChange={v => setEndMinute(v[0])} />
              </div>
            </div>
          </div>
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

      <div className="flex justify-end gap-2">
        <Button type="submit">Log Activity</Button>
      </div>
    </form>
  )
}
