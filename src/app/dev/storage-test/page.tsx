// src/app/dev/storage-test/page.tsx
'use client'

import { useState } from 'react'
import { auth, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Button } from '@/components/ui/button'

export default function StorageTestPage() {
  const [result, setResult] = useState<string>('')

  async function uploadText() {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('Not signed in')

      const storagePath = `reports/${uid}/dev/${Date.now()}.txt`
      const r = ref(storage, storagePath)
      const content = new Blob([`Hello from storage-test at ${new Date().toISOString()}`], {
        type: 'text/plain',
      })
      await uploadBytes(r, content, { contentType: 'text/plain' })
      const url = await getDownloadURL(r)
      setResult(`Upload OK → ${url}`)
    } catch (e: any) {
      setResult(`Upload FAILED → ${e?.code ?? 'unknown'} | ${e?.message ?? String(e)}`)
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Storage Upload Test</h1>
      <p>Click the button to upload a small text file to your bucket.</p>
      <Button onClick={uploadText}>Upload test file</Button>
      {result && <pre className="rounded bg-muted p-3 text-sm whitespace-pre-wrap">{result}</pre>}
    </main>
  )
}
