'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';

function getTitleFromPath(path: string): string {
  if (path === '/dashboard') return 'Dashboard';
  const pathName = path.split('/').pop() || 'Dashboard';
  return pathName
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function PageHeader() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const title = getTitleFromPath(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      {isMobile && <SidebarTrigger />}
      <div className="flex-1">
        <h1 className="font-headline text-xl font-semibold tracking-tight">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <UserNav />
      </div>
    </header>
  );
}
