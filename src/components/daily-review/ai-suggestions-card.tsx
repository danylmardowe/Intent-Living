// src/components/daily-review/ai-suggestions-card.tsx
'use client'

import * as React from 'react'
import { useAuth } from '@/context/auth-context'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import type { GenerateResponse } from '@/lib/ai-extraction-types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

type CandidateType = 'activity' | 'task' | 'goal'
type Status = 'backlog' | 'scheduled' | 'today' | 'inprogress' | 'blocked'

type Candidate = {
  id: string
  type: CandidateType
  include: boolean
  // shared
  title: string
  // activity-only
  durationMins?: number
  notes?: string
  energyHint?: 'low' | 'medium' | 'high'
  // task-only
  description?: string
  status?: Status
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/**
 * Optional integration hook: dispatch an event to open your existing Task Add modal.
 * Somewhere in your app, listen for 'intent:openTaskAdd' and open your dialog with prefill.
 */
function openTaskAddModal(prefill: {
  title: string
  description?: string
  status?: Status
  source?: 'journal-extract'
  sourceJournalEntryId?: string | null
}) {
  try {
    document.dispatchEvent(new CustomEvent('intent:openTaskAdd', { detail: { prefill } }))
    return true
  } catch {
    return false
  }
}

export default function AiSuggestionsCard({
  suggestions,
  sourceJournalEntryId,
  onClear,
}: {
  suggestions: GenerateResponse
  sourceJournalEntryId: string | null
  onClear: () => void
}) {
  const { user } = useAuth()
  const [items, setItems] = React.useState<Candidate[]>([])

  React.useEffect(() => {
    const next: Candidate[] = []
    for (const a of suggestions.activities ?? []) {
      next.push({
        id: uuid(),
        type: 'activity',
        include: true,
        title: a.title,
        durationMins: a.durationMins,
        notes: a.notes,
        energyHint: a.energyHint,
      })
    }
    for (const t of suggestions.tasks ?? []) {
      next.push({
        id: uuid(),
        type: 'task',
        include: true,
        title: t.title,
        description: t.description,
        status: (t.status as Status) ?? 'backlog',
      })
    }
    for (const g of suggestions.goals ?? []) {
      next.push({
        id: uuid(),
        type: 'goal',
        include: true,
        title: g.title,
        description: g.description,
      })
    }
    setItems(next)
  }, [suggestions])

  const [busy, setBusy] = React.useState(false)

  async function persistSelected() {
    if (!user?.uid) return
    setBusy(true)
    try {
      const inc = items.filter(i => i.include && i.title.trim())

      for (const c of inc) {
        if (c.type === 'activity') {
          await addDoc(collection(db, 'users', user.uid, 'activities'), {
            title: c.title.trim(),
            duration: c.durationMins ? c.durationMins * 60 * 1000 : undefined,
            notes: c.notes?.trim() || undefined,
            energyLevel:
              c.energyHint === 'high' ? 3 :
              c.energyHint === 'medium' ? 2 :
              c.energyHint === 'low' ? 1 : undefined,
            source: 'journal-extract',
            sourceJournalEntryId: sourceJournalEntryId || undefined,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        } else if (c.type === 'task') {
          await addDoc(collection(db, 'users', user.uid, 'tasks'), {
            title: c.title.trim(),
            description: c.description?.trim() || undefined,
            status: c.status ?? 'backlog',
            source: 'journal-extract',
            sourceJournalEntryId: sourceJournalEntryId || undefined,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        } else {
          await addDoc(collection(db, 'users', user.uid, 'goals'), {
            title: c.title.trim(),
            description: c.description?.trim() || undefined,
            source: 'journal-extract',
            sourceJournalEntryId: sourceJournalEntryId || undefined,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        }
      }

      onClear()
    } finally {
      setBusy(false)
    }
  }

  function openTaskModalsForSelected() {
    const inc = items.filter(i => i.include && i.type === 'task' && i.title.trim())
    let opened = 0
    for (const c of inc) {
      const ok = openTaskAddModal({
        title: c.title.trim(),
        description: c.description?.trim() || undefined,
        status: c.status ?? 'backlog',
        source: 'journal-extract',
        sourceJournalEntryId,
      })
      if (ok) opened++
    }
    if (opened > 0) onClear()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI suggestions</CardTitle>
        <CardDescription>Toggle include, reclassify each item, and add via your normal flows.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suggestions.</p>
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <div key={c.id} className="rounded-md border p-3">
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Label className="sr-only" htmlFor={`title-${c.id}`}>Title</Label>
                    <Input
                      id={`title-${c.id}`}
                      value={c.title}
                      onChange={(e) =>
                        setItems(prev => prev.map(x => x.id === c.id ? { ...x, title: e.target.value } : x))
                      }
                    />

                    {c.type === 'activity' ? (
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`dur-${c.id}`}>Duration (mins)</Label>
                          <Input
                            id={`dur-${c.id}`}
                            type="number"
                            inputMode="numeric"
                            value={c.durationMins ?? ''}
                            onChange={(e) => {
                              const v = e.target.value
                              const n = v === '' ? undefined : Number(v)
                              setItems(prev => prev.map(x => x.id === c.id ? { ...x, durationMins: Number.isFinite(n) ? n : undefined } : x))
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`notes-${c.id}`}>Notes (optional)</Label>
                          <Input
                            id={`notes-${c.id}`}
                            value={c.notes ?? ''}
                            onChange={(e) =>
                              setItems(prev => prev.map(x => x.id === c.id ? { ...x, notes: e.target.value } : x))
                            }
                          />
                        </div>
                      </div>
                    ) : c.type === 'task' ? (
                      <div className="mt-2 grid gap-3">
                        <div>
                          <Label htmlFor={`desc-${c.id}`}>Description (optional)</Label>
                          <Textarea
                            id={`desc-${c.id}`}
                            rows={2}
                            value={c.description ?? ''}
                            onChange={(e) =>
                              setItems(prev => prev.map(x => x.id === c.id ? { ...x, description: e.target.value } : x))
                            }
                          />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select
                            value={c.status ?? 'backlog'}
                            // FIX: Radix expects (value: string) => void; cast inside.
                            onValueChange={(val: string) =>
                              setItems(prev =>
                                prev.map(x =>
                                  x.id === c.id ? { ...x, status: (val as Status) } : x
                                )
                              )
                            }
                          >
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="backlog">Backlog</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="inprogress">In progress</SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              openTaskAddModal({
                                title: c.title.trim(),
                                description: c.description?.trim() || undefined,
                                status: c.status ?? 'backlog',
                                source: 'journal-extract',
                                sourceJournalEntryId,
                              })
                            }}
                          >
                            Open Task modal…
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <Label htmlFor={`gdesc-${c.id}`}>Description (optional)</Label>
                        <Textarea
                          id={`gdesc-${c.id}`}
                          rows={2}
                          value={c.description ?? ''}
                          onChange={(e) =>
                            setItems(prev => prev.map(x => x.id === c.id ? { ...x, description: e.target.value } : x))
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="w-[220px] space-y-3">
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={c.type}
                        onValueChange={(val: CandidateType) =>
                          setItems(prev => prev.map(x => x.id === c.id ? { ...x, type: val } : x))
                        }
                      >
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activity">Activity</SelectItem>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="goal">Goal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor={`inc-${c.id}`}>Include</Label>
                      <Switch
                        id={`inc-${c.id}`}
                        checked={c.include}
                        onCheckedChange={(v) =>
                          setItems(prev => prev.map(x => x.id === c.id ? { ...x, include: v } : x))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClear} disabled={busy}>Clear</Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={openTaskModalsForSelected}
            disabled={!items.some(i => i.include && i.type === 'task')}
            title="Open your existing Task Add dialog for each included task"
          >
            Use Task modals
          </Button>
          <Button onClick={persistSelected} disabled={busy || !user?.uid}>
            {busy ? 'Adding…' : 'Add selected'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
