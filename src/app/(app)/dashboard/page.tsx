import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowUpRight, CheckCircle, Target } from 'lucide-react';
import Link from 'next/link';
import LifeBalanceChart from '@/components/dashboard/life-balance-chart';
import OverviewCards from '@/components/dashboard/overview-cards';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Welcome back, User
        </h1>
        <p className="text-muted-foreground">
          Here's your lifeline for today. Let's make it a great one.
        </p>
      </div>

      <OverviewCards />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Life Balance</CardTitle>
            <CardDescription>
              Your time distribution across different life areas this week.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <LifeBalanceChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Active Mode: Deep Work</CardTitle>
            <CardDescription>
             Your current mindset shapes your day.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
             <div className="rounded-md border bg-accent/20 p-4">
                <h4 className="font-semibold text-accent-foreground/90">Mindsets</h4>
                <ul className="mt-2 list-disc pl-5 text-sm text-accent-foreground/80">
                    <li>I am focused and productive.</li>
                    <li>I am calm and present.</li>
                </ul>
             </div>
             <div className="rounded-md border bg-accent/20 p-4">
                <h4 className="font-semibold text-accent-foreground/90">Active Life Areas</h4>
                <ul className="mt-2 list-disc pl-5 text-sm text-accent-foreground/80">
                    <li>Career & Work</li>
                    <li>Personal Growth</li>
                </ul>
             </div>
             <Button variant="outline" asChild>
                <Link href="/modes">
                    Switch Mode <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
