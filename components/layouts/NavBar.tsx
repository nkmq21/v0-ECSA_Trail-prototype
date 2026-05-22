'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Map, BarChart3, ShoppingBag, Pencil, Globe, Wifi, Wallet, MapPin, Package, BadgeCheck, Clock, LogOut, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ECSATrailLogo } from '@/components/ai/ECSATrailLogo'
import { useLanguage } from '@/components/ui/LanguageContext'
import { useUser } from '@/components/ui/UserContext'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MOCK_PLANS } from '@/lib/mock-data'

export type AppTab = 'planner' | 'marketplace' | 'creator' | 'dashboard'

interface NavBarProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

export function NavBar({ activeTab, onTabChange }: NavBarProps) {
  const { t, language, setLanguage } = useLanguage()
  const user = useUser()
  const [profileOpen, setProfileOpen] = useState(false)

  const ownedPlans = MOCK_PLANS.filter(p => user.ownedPlanIds.has(p.id))

  const TABS: { id: AppTab; label: string; icon: React.ElementType; highlight?: boolean }[] = [
    { id: 'planner', label: t('navPlanner'), icon: Map },
    { id: 'marketplace', label: t('navMarketplace'), icon: ShoppingBag, highlight: true },
    { id: 'creator', label: t('navCreator'), icon: Pencil },
    { id: 'dashboard', label: t('navDashboard'), icon: BarChart3 },
  ]

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

            {/* Wallet balance chip */}
            <button
              onClick={() => setProfileOpen(true)}
              className="hidden sm:flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Wallet className="w-3 h-3" />
              ${user.walletBalance.toFixed(2)}
            </button>

            {/* AI status */}
            <div className="hidden lg:flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full px-3 py-1.5 text-xs font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {t('aiStatus')}
            </div>

            {/* User avatar */}
            <button
              onClick={() => setProfileOpen(true)}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center hover:bg-primary/20 transition-all ring-2 ring-transparent hover:ring-primary/30"
            >
              {user.avatarInitials}
            </button>
          </div>
        </div>
      </header>

      {/* Profile sheet */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="right" className="w-80 p-0 flex flex-col gap-0">
          {/* Header */}
          <SheetHeader className="flex-none px-5 pt-5 pb-4 border-b border-border text-left">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-bold text-xl flex items-center justify-center flex-shrink-0">
                {user.avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <SheetTitle className="text-base leading-tight">{user.name}</SheetTitle>
                  {user.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {user.province}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{user.bio}</p>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-5 space-y-5">

              {/* Wallet */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-foreground">ECSACredits</span>
                  </div>
                  <motion.span
                    key={user.walletBalance}
                    initial={{ scale: 1.15, color: '#16a34a' }}
                    animate={{ scale: 1, color: '#15803d' }}
                    transition={{ duration: 0.3 }}
                    className="text-xl font-bold text-green-700"
                  >
                    ${user.walletBalance.toFixed(2)}
                  </motion.span>
                </div>
                <p className="text-[10px] text-green-600 mb-2.5">Use credits to purchase plans on the marketplace</p>
                <div className="flex gap-2">
                  {[10, 20, 50].map(amt => (
                    <button
                      key={amt}
                      onClick={() => user.topUpWallet(amt)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 bg-white border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                  <div className="text-lg font-bold text-foreground">{ownedPlans.length}</div>
                  <div className="text-[10px] text-muted-foreground">Owned Plans</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                  <div className="text-sm font-bold text-foreground">{user.joinedAt.split(' ')[1]}</div>
                  <div className="text-[10px] text-muted-foreground">Member Since</div>
                </div>
              </div>

              {/* Owned plans */}
              {ownedPlans.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">My Plans ({ownedPlans.length})</p>
                  <div className="space-y-2">
                    {ownedPlans.map(plan => (
                      <div key={plan.id} className="flex items-center gap-2.5 p-2.5 bg-card border border-border rounded-lg hover:border-primary/20 transition-colors">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-3.5 h-3.5 text-primary/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{plan.title}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />{plan.duration}d · {plan.provinces[0]}
                          </p>
                        </div>
                        <button
                          onClick={() => { onTabChange('planner'); setProfileOpen(false) }}
                          className="text-[10px] text-primary font-medium hover:underline flex-shrink-0"
                        >
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LogOut className="w-3.5 h-3.5" />
                <span>Joined {user.joinedAt}</span>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
