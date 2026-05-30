'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Map, BarChart3, ShoppingBag, Pencil, Globe, Wifi, MapPin, BadgeCheck, LogOut, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ECSATrailLogo } from '@/components/ai/ECSATrailLogo'
import { useLanguage } from '@/components/ui/LanguageContext'
import { useUser } from '@/components/ui/UserContext'
import { createClientClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

export type AppTab = 'planner' | 'marketplace' | 'creator' | 'dashboard'

interface NavBarProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function NavBar({ activeTab, onTabChange }: NavBarProps) {
  const { t, language, setLanguage } = useLanguage()
  const { profile, isLoading } = useUser()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)

  const initials = profile ? getInitials(profile.name) : ''

  const TABS: { id: AppTab; label: string; icon: React.ElementType; highlight?: boolean }[] = [
    { id: 'planner', label: t('navPlanner'), icon: Map },
    { id: 'marketplace', label: t('navMarketplace'), icon: ShoppingBag, highlight: true },
    { id: 'creator', label: t('navCreator'), icon: Pencil },
    { id: 'dashboard', label: t('navDashboard'), icon: BarChart3 },
  ]

  async function handleSignOut() {
    const supabase = createClientClient()
    setProfileOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
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

            {isLoading ? (
              <>
                <div className="hidden sm:block w-20 h-7 rounded-full bg-muted animate-pulse" />
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              </>
            ) : profile ? (
              <>
                {/* Points chip */}
                <button
                  onClick={() => setProfileOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  <Star className="w-3 h-3 fill-current" />
                  {profile.pointsBalance} pts
                </button>

                {/* AI status */}
                <div className="hidden lg:flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full px-3 py-1.5 text-xs font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {t('aiStatus')}
                </div>

                {/* Avatar */}
                <button
                  onClick={() => setProfileOpen(true)}
                  className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center hover:bg-primary/20 transition-all ring-2 ring-transparent hover:ring-primary/30 overflow-hidden"
                >
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </button>
              </>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Profile sheet — only mounted when profile exists */}
      {profile && (
        <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
          <SheetContent side="right" className="w-80 p-0 flex flex-col gap-0">
            {/* Header */}
            <SheetHeader className="flex-none px-5 pt-5 pb-4 border-b border-border text-left">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-bold text-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <SheetTitle className="text-base leading-tight">{profile.name}</SheetTitle>
                    {profile.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                  </div>
                  {profile.province && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {profile.province}
                    </div>
                  )}
                </div>
              </div>
              {profile.bio && (
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{profile.bio}</p>
              )}
            </SheetHeader>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 space-y-5">
                {/* Points */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-600 fill-current" />
                      <span className="text-sm font-semibold text-foreground">ECSAPoints</span>
                    </div>
                    <span className="text-xl font-bold text-amber-700">{profile.pointsBalance}</span>
                  </div>
                  <p className="text-[10px] text-amber-600 mt-1.5">Earned from challenges and trail completions</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                    <div className="text-lg font-bold text-foreground">Lv.{profile.level}</div>
                    <div className="text-[10px] text-muted-foreground">Level</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                    <div className="text-sm font-bold text-foreground">{profile.joinedAt.split(' ')[1]}</div>
                    <div className="text-[10px] text-muted-foreground">Member Since</div>
                  </div>
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground">
                  Joined {profile.joinedAt}
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex-none p-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/5 border-border"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
