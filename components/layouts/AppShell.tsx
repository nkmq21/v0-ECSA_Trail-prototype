'use client'

import { useRouter, usePathname } from 'next/navigation'
import { NavBar, type AppTab } from '@/components/layouts/NavBar'
import { LanguageProvider } from '@/components/ui/LanguageContext'
import { UserProvider } from '@/components/ui/UserContext'

const TAB_ROUTES: Record<AppTab, string> = {
  marketplace: '/marketplace',
  planner: '/dashboard/itinerary',
  creator: '/dashboard/create',
  dashboard: '/dashboard/my-plans',
}

function pathnameToTab(pathname: string): AppTab {
  if (pathname.startsWith('/dashboard/itinerary')) return 'planner'
  if (pathname.startsWith('/dashboard/create')) return 'creator'
  if (pathname.startsWith('/dashboard/my-plans')) return 'dashboard'
  return 'marketplace'
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <LanguageProvider>
      <UserProvider>
        <div className="flex flex-col h-screen bg-background overflow-hidden">
          <NavBar
            activeTab={pathnameToTab(pathname)}
            onTabChange={(tab) => router.push(TAB_ROUTES[tab])}
          />
          <main className="flex-1 overflow-hidden" role="main">
            {children}
          </main>
        </div>
      </UserProvider>
    </LanguageProvider>
  )
}
