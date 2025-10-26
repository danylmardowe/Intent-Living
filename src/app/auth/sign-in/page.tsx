// src/app/auth/sign-in/page.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function SignInPage() {
  const router = useRouter()
  const next = useSearchParams().get('next') ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push(next)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setBusy(true); setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
      router.push(next)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use email/password or continue with Google.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleEmail}>
            <Input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>Sign in</Button>
              <Button type="button" variant="outline" onClick={handleGoogle} disabled={busy}>Google</Button>
            </div>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            New here? <a className="underline" href="/auth/sign-up">Create an account</a>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
