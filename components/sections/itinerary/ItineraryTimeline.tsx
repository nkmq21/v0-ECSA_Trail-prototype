'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  Clock, Navigation, MapPin, Footprints, Car, Bike, Bus,
  ShieldCheck, ChevronDown, ChevronUp, Zap, CloudRain,
  Building2, CheckCircle2, ArrowRightLeft, AlertTriangle,
  ArrowRight, RotateCcw, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Landmark } from '@/lib/types'
import { VIETNAM_LANDMARKS } from '@/lib/mock-data'
import { useLanguage } from '@/components/ui/LanguageContext'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stop {
  landmark: Landmark
  order: number
  travelTime: number
  transportMode: 'walk' | 'taxi' | 'motorbike' | 'bus'
  notes: string
  /** Set when this stop was substituted in Plan B */
  replacedBy?: Landmark
  /** Set on the Plan B stop to record what it replaced */
  replacedFrom?: Landmark
}

interface ItineraryTimelineProps {
  stops: Stop[]
  weatherAlert?: {
    type: 'rain' | 'storm' | 'clear'
    severity: 'low' | 'medium' | 'high'
    message: string
    affectedStops: string[]
    planBGenerated: boolean
  }
}

// ─── Mock Plan B substitutions ───────────────────────────────────────────────

const PLAN_B_SUBS: Record<string, { replacement: Landmark; reason: string; reasonVi: string }> = {
  [VIETNAM_LANDMARKS[7].id]: {
    replacement: VIETNAM_LANDMARKS[3], // Son Doong Cave
    reason: 'Cave system — naturally sheltered from all weather',
    reasonVi: 'Hệ thống hang động — hoàn toàn che chắn khỏi thời tiết',
  },
  [VIETNAM_LANDMARKS[2].id]: {
    replacement: VIETNAM_LANDMARKS[4], // Ben Thanh Market
    reason: 'Iconic indoor market — rain-friendly, local food & souvenirs',
    reasonVi: 'Chợ trong nhà nổi tiếng — phù hợp khi mưa, đồ ăn và quà lưu niệm',
  },
  [VIETNAM_LANDMARKS[6].id]: {
    replacement: VIETNAM_LANDMARKS[3], // Son Doong
    reason: 'World\'s largest cave — fully sheltered indoor experience',
    reasonVi: 'Hang động lớn nhất thế giới — trải nghiệm hoàn toàn trong nhà',
  },
}

const TRANSPORT_ICONS = {
  walk: Footprints, taxi: Car, motorbike: Bike, bus: Bus,
}
const TRANSPORT_LABELS_EN = { walk: 'Walk', taxi: 'Taxi', motorbike: 'Motorbike', bus: 'Bus' }
const TRANSPORT_LABELS_VI = { walk: 'Đi bộ', taxi: 'Taxi', motorbike: 'Xe máy', bus: 'Xe buýt' }

// ─── Sub-components ──────────────────────────────────────────────────────────

function TravelSegment({
  time,
  mode,
  language,
  isPlanB,
}: {
  time: number
  mode: 'walk' | 'taxi' | 'motorbike' | 'bus'
  language: string
  isPlanB: boolean
}) {
  const Icon = TRANSPORT_ICONS[mode]
  const labels = language === 'vi' ? TRANSPORT_LABELS_VI : TRANSPORT_LABELS_EN
  return (
    <div className="flex items-center gap-3 py-1 pl-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-px h-3 rounded-full',
            isPlanB ? 'bg-primary/30' : 'bg-border'
          )}
        />
        <div
          className={cn(
            'rounded-full p-1 border',
            isPlanB
              ? 'bg-primary/10 border-primary/20'
              : 'bg-background border-border'
          )}
        >
          <Icon className={cn('w-3 h-3', isPlanB ? 'text-primary' : 'text-muted-foreground')} />
        </div>
        <div
          className={cn(
            'w-px h-3 rounded-full',
            isPlanB ? 'bg-primary/30' : 'bg-border'
          )}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {time} {language === 'vi' ? 'phút' : 'min'} · {labels[mode]}
      </span>
    </div>
  )
}

function LocationChangedAlert({ stop, isPlanView }: { stop: Stop; isPlanView: 'a' | 'b' }) {
  const { t, language } = useLanguage()
  const [open, setOpen] = useState(false)
  if (!stop.replacedBy && !stop.replacedFrom) return null

  const otherLandmark = isPlanView === 'a' ? stop.replacedBy : stop.replacedFrom
  if (!otherLandmark) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="overflow-hidden mt-2"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors',
          isPlanView === 'a'
            ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
            : 'bg-primary/5 hover:bg-primary/10'
        )}
      >
        <AlertTriangle
          className={cn(
            'w-3 h-3 flex-shrink-0',
            isPlanView === 'a' ? 'text-orange-500' : 'text-primary'
          )}
        />
        <span
          className={cn(
            'text-xs font-medium flex-1',
            isPlanView === 'a'
              ? 'text-orange-700 dark:text-orange-400'
              : 'text-primary'
          )}
        >
          {t('planBLocationAlert')}
          {isPlanView === 'a' ? ` — ${language === 'vi' ? 'Kế hoạch B:' : 'Plan B:'}` : ` — ${language === 'vi' ? 'Từ Kế hoạch A:' : 'From Plan A:'}`}
          {' '}
          <span className="font-semibold">
            {language === 'vi' ? otherLandmark.name : otherLandmark.nameEn}
          </span>
        </span>
        {open ? (
          <ChevronUp className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2.5 pt-1.5 pb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="w-3 h-3 flex-shrink-0" />
              <span>{t('planBLocationAlertDesc')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StopCard({
  stop,
  index,
  isPlanB,
  isAffected,
  activeView,
}: {
  stop: Stop
  index: number
  isPlanB: boolean
  isAffected: boolean
  activeView: 'a' | 'b'
}) {
  const { t, language } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const displayName = language === 'vi' ? stop.landmark.name : stop.landmark.nameEn
  const isChanged = !!stop.replacedBy || !!stop.replacedFrom

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 280, damping: 26 }}
      className={cn(
        'relative rounded-2xl border bg-card overflow-hidden',
        isPlanB
          ? 'border-primary/30 ring-1 ring-primary/15'
          : isAffected
            ? 'border-orange-200 dark:border-orange-800 ring-1 ring-orange-100 dark:ring-orange-900'
            : 'border-border hover:border-primary/20',
        'transition-shadow duration-200 hover:shadow-sm'
      )}
    >
      {/* Top color bar */}
      {isPlanB && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/70 to-accent" />
      )}
      {isAffected && !isPlanB && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-amber-300" />
      )}
      {isChanged && !isPlanB && !isAffected && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/30" />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Order badge */}
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
              isPlanB
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {stop.order}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-semibold text-sm text-foreground leading-tight">{displayName}</h4>
                  {isPlanB && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                      <Building2 className="w-2.5 h-2.5" />
                      {language === 'vi' ? 'Trong nhà' : 'Indoor'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                  {language === 'vi' ? stop.landmark.nameEn : stop.landmark.name}
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs">{stop.landmark.province}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">
                      {stop.landmark.duration}h {language === 'vi' ? 'đề xuất' : 'suggested'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right badges */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {stop.landmark.sourceVerified && (
                  <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-xs font-medium">{t('verified')}</span>
                  </div>
                )}
                <Badge variant="secondary" className="text-xs capitalize">
                  {stop.landmark.category}
                </Badge>
              </div>
            </div>

            {/* Credibility bar */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    stop.landmark.credibilityScore >= 90
                      ? 'bg-green-500'
                      : stop.landmark.credibilityScore >= 75
                        ? 'bg-accent'
                        : 'bg-orange-400'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${stop.landmark.credibilityScore}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 + index * 0.06 }}
                />
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">
                {stop.landmark.credibilityScore}/100
              </span>
            </div>

            {/* Tips */}
            {stop.notes && (
              <>
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline underline-offset-2"
                >
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expanded ? t('hideTips') : t('showTips')}
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-muted-foreground mt-1.5 leading-relaxed overflow-hidden"
                    >
                      {stop.notes}
                    </motion.p>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Location change alert */}
            <LocationChangedAlert stop={stop} isPlanView={activeView} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Plan switcher tab bar ───────────────────────────────────────────────────

function PlanTabBar({
  activeView,
  onSwitch,
  activePlan,
  onSetActive,
  planBAccepted,
  hasPlanB,
}: {
  activeView: 'a' | 'b'
  onSwitch: (v: 'a' | 'b') => void
  activePlan: 'a' | 'b'
  onSetActive: (v: 'a' | 'b') => void
  planBAccepted: boolean
  hasPlanB: boolean
}) {
  const { t, language } = useLanguage()
  if (!hasPlanB) return null

  return (
    <div className="space-y-2">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
        {(['a', 'b'] as const).map((plan) => {
          const isViewing = activeView === plan
          const isActivePlan = activePlan === plan
          const label = plan === 'a' ? t('planBTabA') : t('planBTabB')
          return (
            <motion.button
              key={plan}
              onClick={() => onSwitch(plan)}
              className={cn(
                'relative flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                isViewing
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isViewing && (
                <motion.div
                  layoutId="plan-tab-indicator"
                  className={cn(
                    'absolute inset-0 rounded-lg shadow-sm',
                    plan === 'b' ? 'bg-primary/10 border border-primary/20' : 'bg-card border border-border'
                  )}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{label}</span>
              {isActivePlan && (
                <span className="relative z-10 flex items-center gap-0.5 bg-green-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {language === 'vi' ? 'Chính' : 'Active'}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Set as Active button row */}
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs text-muted-foreground">
          {activePlan === 'a' 
            ? (language === 'vi' ? 'Kế hoạch A đang sử dụng' : 'Plan A is active')
            : (language === 'vi' ? 'Kế hoạch B đang sử dụng' : 'Plan B is active')}
        </span>
        {activeView !== activePlan && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Button
              size="sm"
              variant={activeView === 'b' ? 'default' : 'outline'}
              onClick={() => onSetActive(activeView)}
              className="h-7 text-xs px-3 rounded-lg gap-1.5"
            >
              <CheckCircle2 className="w-3 h-3" />
              {t('setAsActive')}
            </Button>
          </motion.div>
        )}
        {activeView === activePlan && (
          <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {t('currentlyActive')}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Accept Plan B card ──────────────────────────────────────────────────────

function AcceptPlanBCard({
  stops,
  onAccept,
  onDismiss,
}: {
  stops: { original: Stop; replacement: Stop }[]
  onAccept: () => void
  onDismiss: () => void
}) {
  const { t, language } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="rounded-2xl border border-primary/25 bg-primary/5 overflow-hidden"
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <CloudRain className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t('planBTitle')}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t('planBDesc')}</p>
          </div>
        </div>

        {/* Swap rows */}
        <div className="space-y-2">
          {stops.map(({ original, replacement }, i) => {
            const sub = PLAN_B_SUBS[original.landmark.id]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card rounded-xl border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  {/* Original */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      {t('planAOriginalLabel')}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <CloudRain className="w-3 h-3 text-orange-400 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground line-through truncate">
                        {language === 'vi' ? original.landmark.name : original.landmark.nameEn}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />

                  {/* Replacement */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1">
                      {t('planBReplacedLabel')}
                    </p>
                    <div className="flex items-start gap-1.5">
                      <Building2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-foreground block truncate">
                          {language === 'vi' ? replacement.landmark.name : replacement.landmark.nameEn}
                        </span>
                        {sub && (
                          <span className="text-xs text-muted-foreground leading-snug">
                            {language === 'vi' ? sub.reasonVi : sub.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1 gap-1.5 rounded-xl h-9 text-xs" onClick={onAccept}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('planBAccept')}
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl h-9 px-4 text-xs" onClick={onDismiss}>
            {t('planBClose')}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Accepted success banner ─────────────────────────────────────────────────

function AcceptedBanner({ onSwitchView }: { onSwitchView: () => void }) {
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3.5"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-800/40 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">{t('planBNowActive')}</p>
          <p className="text-xs text-green-700 dark:text-green-400/80 mt-0.5 leading-relaxed">
            {t('planBNowActiveDesc')}
          </p>
          <button
            onClick={onSwitchView}
            className="mt-2 flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 hover:underline underline-offset-2"
          >
            <ArrowRightLeft className="w-3 h-3" />
            {t('planBSwitchToA')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ItineraryTimeline({ stops, weatherAlert }: ItineraryTimelineProps) {
  const { t, language } = useLanguage()
  const affectedIds = weatherAlert?.affectedStops ?? []
  const hasPlanB = weatherAlert?.planBGenerated === true

  const [planBAccepted, setPlanBAccepted] = useState(false)
  const [showAcceptCard, setShowAcceptCard] = useState(false)
  const [activeView, setActiveView] = useState<'a' | 'b'>('a')
  const [activePlan, setActivePlan] = useState<'a' | 'b'>('a') // which plan is the "active" schedule

  // Build Plan B stops: substitute affected stops with indoor alternatives
  const planBStops: Stop[] = stops.map(stop => {
    if (!affectedIds.includes(stop.landmark.id)) return stop
    const sub = PLAN_B_SUBS[stop.landmark.id]
    if (!sub) return stop
    return {
      ...stop,
      landmark: sub.replacement,
      notes: language === 'vi' ? sub.reasonVi : sub.reason,
      replacedFrom: stop.landmark,
    } satisfies Stop
  })

  // Plan A stops annotated with their Plan B replacements
  const planAStops: Stop[] = stops.map(stop => {
    if (!affectedIds.includes(stop.landmark.id)) return stop
    const sub = PLAN_B_SUBS[stop.landmark.id]
    if (!sub) return stop
    return { ...stop, replacedBy: sub.replacement }
  })

  // Pairs used in AcceptPlanBCard
  const swapPairs = stops
    .filter(s => affectedIds.includes(s.landmark.id) && PLAN_B_SUBS[s.landmark.id])
    .map(s => ({
      original: s,
      replacement: {
        ...s,
        landmark: PLAN_B_SUBS[s.landmark.id].replacement,
        notes: PLAN_B_SUBS[s.landmark.id].reason,
        replacedFrom: s.landmark,
      } satisfies Stop,
    }))

  // Active itinerary shown as "current"
  const activeStops = activeView === 'b' ? planBStops : planAStops

  function handleAccept() {
    setPlanBAccepted(true)
    setShowAcceptCard(false)
    setActiveView('b')
    setActivePlan('b') // Set Plan B as the active schedule
  }

  function handleSetActive(plan: 'a' | 'b') {
    setActivePlan(plan)
    if (plan === 'b' && !planBAccepted) {
      setPlanBAccepted(true)
    }
  }

  function handleSwitchView(v: 'a' | 'b') {
    setActiveView(v)
  }

  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Navigation className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{t('noItinerary')}</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed text-balance">
            {t('noItineraryDesc')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Fixed header ── */}
      <div className="flex-none px-4 pt-4 pb-3 border-b border-border space-y-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-sm text-foreground">{t('timelineTitle')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeStops.length} {t('timelineSubtitle')}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {planBAccepted && activeView === 'b' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-bold"
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
                {t('planBActiveBadge')}
              </motion.span>
            )}
            <div className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium">
              <Zap className="w-3 h-3" />
              {t('gapFilled')}
            </div>
          </div>
        </div>

        {/* Plan A / B tab switcher */}
        {hasPlanB && (
<PlanTabBar
            activeView={activeView}
            onSwitch={handleSwitchView}
            activePlan={activePlan}
            onSetActive={handleSetActive}
            planBAccepted={planBAccepted}
            hasPlanB={hasPlanB}
          />
        )}
      </div>

      {/* ── Scrollable body ── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-1">
          {/* Weather alert banner */}
          <AnimatePresence>
            {weatherAlert && !planBAccepted && (
              <motion.div
                key="weather-banner"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 overflow-hidden"
              >
                <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-3">
                  <div className="flex items-start gap-2.5">
                    <CloudRain className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                        {t('weatherAlertLabel')}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400/80 mt-0.5 leading-relaxed">
                        {weatherAlert.message}
                      </p>
                      {hasPlanB && !showAcceptCard && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowAcceptCard(true)
                            setActiveView('b')
                          }}
                          className="mt-2 h-7 text-xs px-3 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/40 rounded-lg gap-1.5"
                        >
                          <CloudRain className="w-3 h-3" />
                          {t('viewPlanB')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Accept Plan B card */}
          <AnimatePresence>
            {showAcceptCard && !planBAccepted && (
              <div key="accept-card" className="mb-3">
                <AcceptPlanBCard
                  stops={swapPairs}
                  onAccept={handleAccept}
                  onDismiss={() => {
                    setShowAcceptCard(false)
                    setActiveView('a')
                  }}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Accepted banner */}
          <AnimatePresence>
            {planBAccepted && activeView === 'b' && (
              <div key="accepted-banner" className="mb-3">
                <AcceptedBanner onSwitchView={() => handleSwitchView('a')} />
              </div>
            )}
          </AnimatePresence>

          {/* View context label */}
          {hasPlanB && (
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  'flex-1 h-px',
                  activeView === 'b' ? 'bg-primary/20' : 'bg-border'
                )}
              />
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  activeView === 'b'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {activeView === 'b' ? t('planBViewingB') : t('planBViewingA')}
              </span>
              <div
                className={cn(
                  'flex-1 h-px',
                  activeView === 'b' ? 'bg-primary/20' : 'bg-border'
                )}
              />
            </div>
          )}

          {/* Switch hint when on Plan A after acceptance */}
          <AnimatePresence>
            {planBAccepted && activeView === 'a' && (
              <motion.div
                key="switch-hint"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mb-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground flex-1">{t('planBNowActiveDesc')}</span>
                <button
                  onClick={() => handleSwitchView('b')}
                  className="text-xs font-semibold text-primary hover:underline underline-offset-2 flex-shrink-0"
                >
                  {t('planBSwitchToB')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Stops list ── */}
          <LayoutGroup>
            <AnimatePresence mode="popLayout">
              {activeStops.map((stop, i) => (
                <div key={`${activeView}-${stop.landmark.id}-${i}`}>
                  <StopCard
                    stop={stop}
                    index={i}
                    isPlanB={activeView === 'b' && affectedIds.includes(
                      stop.replacedFrom?.id ?? stop.landmark.id
                    )}
                    isAffected={
                      activeView === 'a' && affectedIds.includes(stop.landmark.id)
                    }
                    activeView={activeView}
                  />
                  {i < activeStops.length - 1 && (
                    <TravelSegment
                      time={activeStops[i + 1].travelTime}
                      mode={activeStops[i + 1].transportMode}
                      language={language}
                      isPlanB={activeView === 'b'}
                    />
                  )}
                </div>
              ))}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </ScrollArea>
    </div>
  )
}
