// ✅ src/app/(app)/layout.tsx
"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import SidebarNav from "@/components/sidebar-nav";
import MobileSidebar from "@/components/mobile-sidebar";
import { useAuth, AuthProvider } from "@/context/auth-context";
import { useEnsureUserDoc } from "@/lib/useEnsureUserDoc";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SignOutButton from "@/components/auth/signout-button";
import ModeSwitcher from "@/components/modes/mode-switcher";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </SidebarProvider>
    </AuthProvider>
  );
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEnsureUserDoc();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">
      {/* ✅ Persistent Sidebar (Desktop) */}
      <SidebarNav />

      {/* ✅ Mobile Sidebar Toggle */}
      <div className="lg:hidden absolute top-3 left-3 z-50">
        <MobileSidebar />
      </div>

      {/* ✅ Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight">Intent Living</h1>
            <ModeSwitcher />
          </div>
          <SignOutButton />
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
