'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, DollarSign, Star, TrendingUp, Zap, Shield, Lock, Globe,
  CheckCircle, AlertCircle, Clock, ChevronRight, Sparkles, BarChart3,
  Edit3, Trash2, Image, Languages, Route, Package, BadgeCheck, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/ui/LanguageContext'
import { MOCK_PLANS, MOCK_CREATORS } from '@/lib/mock-data'
import type { TravelPlan } from '@/lib/types'

const MY_CREATOR = MOCK_CREATORS[0]
// Plans authored by this creator
const MY_PLANS = MOCK_PLANS.filter(p => p.creator.id === MY_CREATOR.id)

function EarningsCard() {
  const { t } = useLanguage()
  const totalRevenue = MY_PLANS.reduce((sum, p) => sum + p.purchaseCount * p.price, 0)
  const platformCut = totalRevenue * 0.15
  const earnings = totalRevenue - platformCut
  const pendingPayout = earnings * 0.12

  const stats = [
    { label: t('totalEarnings'), value: `$${earnings.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: t('totalSales'), value: MY_PLANS.reduce((s, p) => s + p.purchaseCount, 0), icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: t('avgRating'), value: MY_CREATOR.rating.toFixed(1), icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t('pendingPayout'), value: `$${pendingPayout.toFixed(2)}`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-base text-foreground">{t('totalEarnings')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('monetizationNote')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {MY_CREATOR.avatar}
          </div>
          {MY_CREATOR.verified && (
            <div className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1">
              <BadgeCheck className="w-3 h-3" />
              {t('creatorBadge')}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-muted/40 rounded-lg p-3 border border-border">
            <div className={cn('w-7 h-7 rounded-md flex items-center justify-center mb-2', bg)}>
              <Icon className={cn('w-3.5 h-3.5', color)} />
            </div>
            <div className="text-base font-bold text-foreground">{value}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue breakdown */}
      <div className="mt-4 bg-muted/30 rounded-lg p-3 border border-border">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground">Revenue breakdown</span>
          <span className="font-medium text-foreground">${totalRevenue.toFixed(2)} gross</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2.5 rounded-full bg-border overflow-hidden flex">
            <div className="h-full bg-green-500 transition-all" style={{ width: '85%' }} />
            <div className="h-full bg-red-400 transition-all" style={{ width: '15%' }} />
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">85% yours · 15% platform</span>
        </div>
      </div>
    </div>
  )
}

function FactCheckBadge({ plan }: { plan: TravelPlan }) {
  const { t } = useLanguage()
  if (plan.factChecked && plan.aiVerified) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
        <CheckCircle className="w-3 h-3" />{t('factCheckPass')}
      </span>
    )
  }
  if (plan.aiVerified && !plan.factChecked) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
        <Clock className="w-3 h-3" />{t('factCheckPending')}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
      <AlertCircle className="w-3 h-3" />{t('factCheckFail')}
    </span>
  )
}

function PlanRowItem({ plan, onEdit }: { plan: TravelPlan; onEdit: () => void }) {
  const { t, language } = useLanguage()
  const title = language === 'vi' ? plan.titleVi : plan.title
  const revenue = plan.purchaseCount * plan.price * 0.85

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-sm hover:border-primary/20 transition-all"
    >
      {/* Cover color swatch */}
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
        <Package className="w-5 h-5 text-primary/60" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
          <FactCheckBadge plan={plan} />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>${plan.price}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{plan.purchaseCount} sold</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{plan.rating}</span>
          <span className="text-green-600 font-medium">${revenue.toFixed(0)} earned</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {plan.shared ? (
          <span className="text-[10px] flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <Globe className="w-2.5 h-2.5" /> Shareable
          </span>
        ) : (
          <span className="text-[10px] flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            <Lock className="w-2.5 h-2.5" /> Private
          </span>
        )}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={onEdit}>
          <Edit3 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground">
          <Eye className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}

function AiPolishPanel({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage()
  const [running, setRunning] = useState<string | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())

  const tools = [
    { id: 'translate', icon: Languages, label: t('aiTranslate'), desc: 'Auto-translate plan to Vietnamese & English', duration: 1200 },
    { id: 'media', icon: Image, label: t('aiAddMedia'), desc: 'Find and attach verified photos for each stop', duration: 1800 },
    { id: 'route', icon: Route, label: t('aiOptimizeRoute'), desc: 'Reorder stops for optimal travel time & flow', duration: 1500 },
    { id: 'factcheck', icon: Shield, label: 'AI Fact-Check', desc: 'Verify all locations against Google Maps & web', duration: 2000 },
  ]

  function runTool(id: string, duration: number) {
    if (done.has(id) || running) return
    setRunning(id)
    setTimeout(() => {
      setDone(prev => new Set([...prev, id]))
      setRunning(null)
    }, duration)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card border border-primary/20 rounded-xl p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">{t('aiPolish')}</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs rounded-lg">Done</Button>
      </div>
      <p className="text-xs text-muted-foreground">{t('aiPolishDesc')}</p>
      <div className="space-y-2">
        {tools.map(({ id, icon: Icon, label, desc, duration }) => (
          <button
            key={id}
            onClick={() => runTool(id, duration)}
            disabled={!!running || done.has(id)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
              done.has(id) ? 'bg-green-50 border-green-200' : 'bg-muted/40 border-border hover:border-primary/30 hover:bg-primary/5',
              running === id && 'bg-primary/5 border-primary/30',
              (!!running && running !== id) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
              done.has(id) ? 'bg-green-100' : 'bg-card border border-border'
            )}>
              {done.has(id) ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                running === id ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Zap className="w-4 h-4 text-primary" />
                  </motion.div>
                ) : <Icon className="w-4 h-4 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-medium', done.has(id) ? 'text-green-700' : 'text-foreground')}>{label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
            </div>
            {!done.has(id) && running !== id && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

function SharingPanel() {
  const { t } = useLanguage()
  const [unlocked, setUnlocked] = useState(false)

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Lock className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground">{t('sharingRestriction')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t('sharingRestrictionDesc')}</p>
        </div>
      </div>

      {unlocked ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700"
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Premium Sharing unlocked. You can now export and share plans outside ECSATrail.</span>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => setUnlocked(true)}
            className="flex flex-col items-start p-3 bg-muted/40 border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
          >
            <span className="text-xs font-semibold text-foreground mb-0.5">{t('perPlanSharing')}</span>
            <span className="text-[10px] text-muted-foreground">Share a single plan externally</span>
          </button>
          <button
            onClick={() => setUnlocked(true)}
            className="flex flex-col items-start p-3 bg-primary/5 border border-primary/30 rounded-lg hover:bg-primary/10 transition-all text-left"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-semibold text-foreground">{t('monthlySharing')}</span>
              <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-bold">Best</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Share all plans, all months</span>
          </button>
        </div>
      )}
    </div>
  )
}

function NewPlanForm({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('9.99')
  const [duration, setDuration] = useState('3')
  const [category, setCategory] = useState('cultural')
  const [province, setProvince] = useState('Hà Nội')

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-sm text-foreground">{t('planBuilder')}</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs rounded-lg">Cancel</Button>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('planName')}</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. 5-Day Ha Long Bay Adventure"
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('planPrice')} ($)</label>
          <input
            value={price}
            onChange={e => setPrice(e.target.value)}
            type="number"
            min="0.99"
            step="0.01"
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <p className="text-[10px] text-muted-foreground mt-1">You earn ${(parseFloat(price || '0') * 0.85).toFixed(2)} after 15% platform fee</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('planDuration')}</label>
          <input
            value={duration}
            onChange={e => setDuration(e.target.value)}
            type="number"
            min="1"
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('planCategory')}</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          >
            {['cultural', 'nature', 'adventure', 'food', 'city', 'beach'].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('planProvince')}</label>
          <input
            value={province}
            onChange={e => setProvince(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Add stops placeholder */}
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('planStops')}</label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">{t('addStop')}</span>
            <span className="text-xs">Drag landmarks from the map or search</span>
          </div>
        </div>

        <div className="sm:col-span-2 flex items-center gap-2 justify-end pt-2 border-t border-border">
          <Button variant="outline" size="sm" className="rounded-lg">{t('saveDraft')}</Button>
          <Button size="sm" className="rounded-lg gap-1.5" disabled={!title}>
            <Globe className="w-3.5 h-3.5" />{t('publishPlan')}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Missing import — add here since it was used above
function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function CreatorStudio() {
  const { t } = useLanguage()
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [showAiPolish, setShowAiPolish] = useState(false)
  const [editingPlan, setEditingPlan] = useState<TravelPlan | null>(null)

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header — flex-none so it never shrinks or scrolls */}
      <div className="flex-none border-b border-border bg-card/60 backdrop-blur-sm px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground text-balance">{t('creatorTitle')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('creatorSubtitle')}</p>
          </div>
          <Button
            size="sm"
            className="rounded-xl gap-1.5 flex-shrink-0"
            onClick={() => { setShowNewPlan(true); setShowAiPolish(false) }}
          >
            <Plus className="w-4 h-4" />{t('createNewPlan')}
          </Button>
        </div>
      </div>

      {/* Scrollable body — flex-1 min-h-0 for proper overflow containment */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="max-w-4xl mx-auto px-6 py-5 space-y-5">
          {/* Earnings overview */}
          <EarningsCard />

          {/* New plan form */}
          <AnimatePresence>
            {showNewPlan && (
              <NewPlanForm onClose={() => setShowNewPlan(false)} />
            )}
          </AnimatePresence>

          {/* AI Polish tools */}
          <AnimatePresence>
            {showAiPolish && (
              <AiPolishPanel onClose={() => setShowAiPolish(false)} />
            )}
          </AnimatePresence>

          {/* Quick action buttons */}
          {!showAiPolish && !showNewPlan && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Sparkles, label: t('aiPolish'), onClick: () => setShowAiPolish(true), color: 'text-primary bg-primary/10 border-primary/20' },
                { icon: Shield, label: 'Fact-Check All', onClick: () => {}, color: 'text-green-600 bg-green-50 border-green-200' },
                { icon: BarChart3, label: 'Analytics', onClick: () => {}, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                { icon: Globe, label: t('premiumSharing'), onClick: () => {}, color: 'text-purple-600 bg-purple-50 border-purple-200' },
              ].map(({ icon: Icon, label, onClick, color }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all hover:shadow-sm hover:-translate-y-0.5',
                    color.includes('primary') ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' :
                    color.includes('green') ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                    color.includes('amber') ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' :
                    'bg-purple-50 border-purple-200 hover:bg-purple-100'
                  )}
                >
                  <Icon className={cn('w-5 h-5', color.split(' ')[0])} />
                  <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
                </button>
              ))}
            </div>
          )}

          {/* My plans list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-foreground">{t('myPlans')}</h2>
              <span className="text-xs text-muted-foreground">{MY_PLANS.length} plans</span>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {MY_PLANS.map(plan => (
                  <PlanRowItem
                    key={plan.id}
                    plan={plan}
                    onEdit={() => setEditingPlan(plan)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Sharing restriction panel */}
          <SharingPanel />

          {/* Platform policy note */}
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/50 rounded-xl p-4 border border-border">
            <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Anti-Hallucination Policy</p>
              <p>All plans are passed through our RAG verification layer using the "Common Denominator" rule — landmarks must appear in 60–70% of data sources (Google Maps, Facebook, travel blogs) before a plan can be listed on the marketplace. The AI fact-checks each stop before publishing.</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
