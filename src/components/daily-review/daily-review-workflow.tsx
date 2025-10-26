'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

type Entry = { id: string; text: string; createdAt?: any }

export default function DailyReviewWorkflow() {
  const [text, setText] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'journal'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    })
    return () => unsub()
  }, [])

  async function save() {
    const uid = auth.currentUser?.uid
    if (!uid || !text.trim()) return
    await addDoc(collection(db, 'users', uid, 'journal'), {
      text: text.trim(),
      createdAt: serverTimestamp(),
    })
    setText('')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Daily Review</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="What happened today? What will you focus on tomorrow?" />
          <Button onClick={save}>Save</Button>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {entries.map(e => (
          <Card key={e.id}>
            <CardHeader>
              <CardTitle className="text-sm">Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{e.text}</p>
            </CardContent>
          </Card>
        ))}
        {entries.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
      </div>
    </div>
  )
}
