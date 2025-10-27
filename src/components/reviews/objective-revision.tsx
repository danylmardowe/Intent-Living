// src/components/reviews/objective-revision.tsx
'use client'

import { useMemo, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { useUserCollection } from '@/lib/useUserCollection'
import { doc, updateDoc } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Objective = {
  id: string
  title: string
  cadence: 'daily' | 'weekly' | 'monthly' | 'sixMonthly'
  status: 'active' | 'paused' | 'retired'
}

export default function ObjectiveRevision({
  cadencesToReview,
  title = 'Objectives Review',
}: {
  cadencesToReview: Objective['cadence'][]
  title?: string
}) {
  const { data: objectives } = useUserCollection<Objective>('objectives', 'title')

  const targets = useMemo(
    () => objectives.filter(o => cadencesToReview.includes(o.cadence)),
    [objectives, cadencesToReview]
  )

  const [local, setLocal] = useState<Record<string, { title: string; status: Objective['status'] }>>(
    () => Object.fromEntries(targets.map(o => [o.id, { title: o.title, status: o.status }]))
  )

  // refresh local cache when targets change
  useMemo(() => {
    setLocal(Object.fromEntries(targets.map(o => [o.id, { title: o.title, status: o.status }])))
  }, [targets])

  async function saveAll() {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await Promise.all(
      targets.map(o => {
        const patch = local[o.id]
        if (!patch) return
        return updateDoc(doc(db, 'users', uid, 'objectives', o.id), {
          title: patch.title.trim() || o.title,
          status: patch.status,
        })
      })
    )
  }

  return (
    <Card className="glass shadow-card">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {targets.map(o => (
          <div key={o.id} className="grid gap-2 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label className="text-xs text-muted-foreground capitalize">{o.cadence}</Label>
              <Input
                defaultValue={o.title}
                onChange={(e) =>
                  setLocal(s => ({
                    ...s,
                    [o.id]: { ...(s[o.id] ?? { title: o.title, status: o.status }), title: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                defaultValue={o.status}
                onValueChange={(v: Objective['status']) =>
                  setLocal(s => ({
                    ...s,
                    [o.id]: { ...(s[o.id] ?? { title: o.title, status: o.status }), status: v },
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}

        {targets.length === 0 && (
          <p className="text-sm text-muted-foreground">No objectives to review.</p>
        )}

        <div className="pt-2">
          <Button onClick={saveAll} variant="soft" disabled={targets.length === 0}>
            Save objective updates
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
