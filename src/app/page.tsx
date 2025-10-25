// src/app/page.tsx
import TestFirebase from '@/app/dev/TestFirebase'

export default function Home() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Intent Living</h1>
      <p className="text-sm text-muted-foreground">
        This is a temporary Firebase connectivity test. You can remove it after verifying.
      </p>
      <TestFirebase />
    </main>
  )
}
