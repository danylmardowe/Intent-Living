// src/app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

export default function Home() {
  const sections = [
    { href: '/dashboard', title: 'Dashboard', description: 'Overview of balance and progress' },
    { href: '/daily-review', title: 'Daily Review', description: 'Reflect and plan your next day' },
    { href: '/goals', title: 'Goals', description: 'Define and track what matters' },
    { href: '/objectives', title: 'Objectives', description: 'Break goals into clear outcomes' },
    { href: '/tasks', title: 'Tasks', description: 'Prioritize and execute with focus' },
    { href: '/life-areas', title: 'Life Areas', description: 'Keep your life balanced' },
    { href: '/modes', title: 'Modes', description: 'Switch contexts with intention' },
  ]

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-10">
      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to Intent Living</h1>
        <p className="max-w-2xl text-muted-foreground">
          Sign in to start fresh with your own account and data.
        </p>
        <div className="flex gap-3">
          <Button asChild><Link href="/auth/sign-in">Sign in</Link></Button>
          <Button asChild variant="outline"><Link href="/auth/sign-up">Create account</Link></Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <Card className="h-full transition hover:shadow-md">
              <CardHeader>
                <CardTitle className="group-hover:underline">{s.title}</CardTitle>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Go to {s.title}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </main>
  )
}
