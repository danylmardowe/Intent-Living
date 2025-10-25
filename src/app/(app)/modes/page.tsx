'use client'

import { useUserCollection } from '@/lib/useUserCollection'
import ModeCard, { Mode } from '@/components/modes/mode-card'
import { Card } from '@/components/ui/card'

export default function ModesPage() {
  const { data: modes, loading } = useUserCollection<Mode>('modes', 'name')

  if (loading) return <div className="p-4">Loading…</div>
  if (modes.length === 0) {
    return <Card className="p-6"><p className="text-muted-foreground">No modes yet.</p></Card>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modes.map((m) => <ModeCard key={m.id} mode={m} />)}
    </div>
  )
}
