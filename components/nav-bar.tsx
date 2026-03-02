'use client'

import { motion } from 'framer-motion'
import { Map, BarChart3, CloudLightning, ShoppingBag, Pencil, Globe, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ECSATrailLogo } from '@/components/ecsa-logo'
import { useLanguage } from '@/components/language-context'
import { Button } from '@/components/ui/button'

export type AppTab = 'planner' | 'marketplace' | 'creator' | 'dashboard' | 'weather'

interface NavBarProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

export function NavBar({ activeTab, onTabChange }: NavBarProps) {
  const { t, language, setLanguage } = useLanguage()

  const TABS: { id: AppTab; label: string; icon: React.ElementType; highlight?: boolean }[] = [
    { id: 'planner', label: t('navPlanner'), icon: Map },
    { id: 'marketplace', label: t('navMarketplace'), icon: ShoppingBag, highlight: true },
    { id: 'creator', label: t('navCreator'), icon: Pencil },
    { id: 'dashboard', label: t('navDashboard'), icon: BarChart3 },
    { id: 'weather', label: t('navWeather'), icon: CloudLightning },
  ]

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-3 flex-shrink-0">
          <ECSATrailLogo size={30} />
          <div className="hidden sm:block">
            <span className="font-bold text-sm text-foreground tracking-tight">{t('appName')}</span>
            <div className="flex items-center gap-1 -mt-0.5">
              <Wifi className="w-2.5 h-2.5 text-green-500" />
              <span className="text-xs text-muted-foreground">{t('appSubtitle')}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide" role="tablist">
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
                  'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
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
                <Icon className="relative w-3.5 h-3.5 flex-shrink-0" />
                <span className="relative hidden md:block">{tab.label}</span>
                {tab.highlight && !isActive && (
                  <span className="relative hidden sm:flex items-center bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    NEW
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {/* Language toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium border-border"
            aria-label={language === 'en' ? 'Switch to Vietnamese' : 'Switch to English'}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('langToggle')}</span>
            <span className="sm:hidden">{language === 'en' ? 'VI' : 'EN'}</span>
          </Button>

          <div className="hidden lg:flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full px-3 py-1.5 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t('aiStatus')}
          </div>
        </div>
      </div>
    </header>
  )
}
