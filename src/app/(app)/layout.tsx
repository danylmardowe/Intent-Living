import PageHeader from '@/components/page-header';
import SidebarNav from '@/components/sidebar-nav';
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar collapsible="icon" variant="inset" side="left">
        <SidebarRail />
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <PageHeader />
        <div className="p-4 lg:p-6">{children}</div>
      </SidebarInset>
    </>
  );
}
