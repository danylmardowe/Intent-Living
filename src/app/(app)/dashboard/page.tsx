// src/app/(app)/dashboard/page.tsx
'use client'

import OverviewCards from '@/components/dashboard/overview-cards'
import LifeBalanceChart from '@/components/dashboard/life-balance-chart'

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <OverviewCards />
      <LifeBalanceChart />
    </main>
  )
}
