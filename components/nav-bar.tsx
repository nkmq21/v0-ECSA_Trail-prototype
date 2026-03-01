'use client'

import { motion } from 'framer-motion'
import { Map, MessageSquare, BarChart3, CloudLightning, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ECSATrailLogo } from '@/components/ecsa-logo'

export type AppTab = 'planner' | 'dashboard' | 'weather'

interface NavBarProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

const TABS: { id: AppTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'planner', label: 'AI Planner', icon: Map, description: 'Interactive map + AI chat' },
  { id: 'dashboard', label: 'Data Insights', icon: BarChart3, description: 'Frequency Rule Dashboard' },
  { id: 'weather', label: 'Re-planning', icon: CloudLightning, description: 'Weather alert simulation' },
]

export function NavBar({ activeTab, onTabChange }: NavBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-4">
          <ECSATrailLogo size={32} />
          <div>
            <span className="font-bold text-sm text-foreground tracking-tight">ECSATrail</span>
            <div className="flex items-center gap-1 -mt-0.5">
              <Wifi className="w-2.5 h-2.5 text-green-500" />
              <span className="text-xs text-muted-foreground">Vietnam AI Planner</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1" role="tablist">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-primary/10 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="relative w-4 h-4" />
                <span className="relative hidden sm:block">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full px-3 py-1.5 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Gemini 2.0 Flash · Live
          </div>
          <div className="hidden lg:flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 text-xs text-muted-foreground">
            <span className="font-mono">PWA</span>
            <span>·</span>
            <span>Offline Ready</span>
          </div>
        </div>
      </div>
    </header>
  )
}
