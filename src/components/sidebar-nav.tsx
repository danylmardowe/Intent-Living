'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  AreaChart,
  BrainCircuit,
  CheckSquare,
  ClipboardCheck,
  GanttChartSquare,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/daily-review', icon: ClipboardCheck, label: 'Daily Review' },
  { href: '/objectives', icon: CheckSquare, label: 'Objectives' },
  { href: '/tasks', icon: GanttChartSquare, label: 'Tasks' },
  { href: '/goals', icon: AreaChart, label: 'Goals' },
  { href: '/life-areas', icon: Sparkles, label: 'Life Areas' },
  { href: '/modes', icon: BrainCircuit, label: 'Modes' },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-2">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
          <h2 className="font-headline text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Lifeline
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label, side: 'right' }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="mt-auto flex flex-col items-center gap-4 p-2 group-data-[collapsible=icon]:hidden">
          <div className="w-full rounded-lg border bg-card p-4 text-center text-card-foreground">
            <h3 className="font-semibold">Need a Boost?</h3>
            <p className="text-sm text-muted-foreground mt-1">Generate personalized journaling prompts to kickstart your reflection.</p>
            <Button size="sm" className="mt-4 w-full">Generate Prompts</Button>
          </div>
        </div>
      </SidebarContent>
    </>
  );
}
