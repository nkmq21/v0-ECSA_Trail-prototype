'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Navigation, MapPin, Footprints, Car, Bike, Bus,
  ShieldCheck, ChevronDown, ChevronUp, Zap, CloudRain,
  Building2, CheckCircle2, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Landmark } from '@/lib/types'
import { VIETNAM_LANDMARKS } from '@/lib/mock-data'
import { useLanguage } from '@/components/language-context'

interface Stop {
  landmark: Landmark
  order: number
  travelTime: number
  transportMode: 'walk' | 'taxi' | 'motorbike' | 'bus'
  notes: string
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

const TRANSPORT_ICONS = {
  walk: Footprints,
  taxi: Car,
  motorbike: Bike,
  bus: Bus,
}

const TRANSPORT_LABELS_EN = { walk: 'Walk', taxi: 'Taxi', motorbike: 'Motorbike', bus: 'Bus' }
const TRANSPORT_LABELS_VI = { walk: 'Đi bộ', taxi: 'Taxi', motorbike: 'Xe máy', bus: 'Xe buýt' }

// Indoor alternatives that replace the affected outdoor stops
const PLAN_B_ALTERNATIVES = [
  {
    original: VIETNAM_LANDMARKS[2], // Hoi An Old Town (outdoor)
    replacement: VIETNAM_LANDMARKS[4], // Ben Thanh Market (indoor)
    reason: 'Great indoor market, rain-friendly — local food & souvenirs',
    reasonVi: 'Chợ trong nhà tuyệt vời, phù hợp khi mưa — đồ ăn địa phương & quà lưu niệm',
  },
  {
    original: VIETNAM_LANDMARKS[7], // Tam Coc
    replacement: VIETNAM_LANDMARKS[3], // Son Doong Cave
    reason: 'Cave system — naturally sheltered from all weather',
    reasonVi: 'Hệ thống hang động — hoàn toàn che chắn khỏi thời tiết',
  },
  {
    original: VIETNAM_LANDMARKS[6], // Mui Ne
    replacement: VIETNAM_LANDMARKS[2], // Hoi An (museum/indoor areas)
    reason: 'Museums and tailoring shops inside the Ancient Town',
    reasonVi: 'Bảo tàng và cửa hàng may trong Phố Cổ Hội An',
  },
]

function TravelSegment({ time, mode, language }: { time: number; mode: 'walk' | 'taxi' | 'motorbike' | 'bus'; language: string }) {
  const Icon = TRANSPORT_ICONS[mode]
  const labels = language === 'vi' ? TRANSPORT_LABELS_VI : TRANSPORT_LABELS_EN
  return (
    <div className="flex items-center gap-2 py-2 pl-8">
      <div className="relative w-0.5 h-8 bg-border mx-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-full p-1">
          <Icon className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{time} {language === 'vi' ? 'phút' : 'min'} · {labels[mode]}</span>
    </div>
  )
}

function StopCard({
  stop,
  index,
  isAffected,
  onViewPlanB,
  planBOpen,
  language,
}: {
  stop: Stop
  index: number
  isAffected: boolean
  onViewPlanB: () => void
  planBOpen: boolean
  language: string
}) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const displayName = language === 'vi' ? stop.landmark.name : stop.landmark.nameEn

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 260, damping: 24 }}
      className={cn(
        'relative rounded-2xl border bg-card overflow-hidden transition-all duration-200',
        isAffected
          ? 'border-orange-200 dark:border-orange-800 ring-1 ring-orange-200 dark:ring-orange-800'
          : 'border-border hover:border-primary/30'
      )}
    >
      {/* Order number */}
      <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 z-10">
        {stop.order}
      </div>

      {isAffected && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-amber-400" />
      )}

      <div className="p-4 pl-14">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-foreground leading-tight">{displayName}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {language === 'vi' ? stop.landmark.nameEn : stop.landmark.name}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
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
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                stop.landmark.credibilityScore >= 90 ? 'bg-green-500' :
                stop.landmark.credibilityScore >= 75 ? 'bg-accent' : 'bg-orange-400'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${stop.landmark.credibilityScore}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 + index * 0.07 }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{stop.landmark.credibilityScore}/100</span>
        </div>

        {/* Tips expandable */}
        {stop.notes && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
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
                  className="text-xs text-muted-foreground mt-2 leading-relaxed overflow-hidden"
                >
                  {stop.notes}
                </motion.p>
              )}
            </AnimatePresence>
          </>
        )}

        {isAffected && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
              <CloudRain className="w-3 h-3" />
              <span className="text-xs font-medium">
                {language === 'vi' ? 'Cảnh báo thời tiết — xem Kế hoạch B' : 'Weather alert — see Plan B'}
              </span>
            </div>
            <button
              onClick={onViewPlanB}
              className={cn(
                'text-xs font-semibold underline underline-offset-2 transition-colors',
                planBOpen
                  ? 'text-primary'
                  : 'text-orange-600 dark:text-orange-400 hover:text-primary'
              )}
            >
              {planBOpen ? t('hidePlanB') : t('viewPlanB')}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Plan B inline panel
function PlanBPanel({ affectedIds, onAccept, onClose }: {
  affectedIds: string[]
  onAccept: () => void
  onClose: () => void
}) {
  const { t, language } = useLanguage()
  const relevantAlts = PLAN_B_ALTERNATIVES.filter(a => affectedIds.includes(a.original.id))

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -8 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="overflow-hidden"
    >
      <div className="mx-0 my-2 rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-3">
        {/* Panel header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <CloudRain className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t('planBTitle')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('planBDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Plan B"
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Swap pairs */}
        <div className="space-y-2">
          {relevantAlts.map((alt, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl border border-border p-3"
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                {/* Original */}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t('planBOriginal')}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground line-through truncate">
                      {language === 'vi' ? alt.original.name : alt.original.nameEn}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center pt-5">
                  <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                    <ChevronDown className="w-3 h-3 text-primary rotate-[-90deg]" />
                  </div>
                </div>

                {/* Replacement */}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-primary mb-1">
                    {t('planBReplacement')}
                  </p>
                  <div className="flex items-start gap-1.5">
                    <Building2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-foreground block truncate">
                        {language === 'vi' ? alt.replacement.name : alt.replacement.nameEn}
                      </span>
                      <span className="text-xs text-muted-foreground leading-snug block">
                        {language === 'vi' ? alt.reasonVi : alt.reason}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Accept button */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 gap-1.5 rounded-xl h-9"
            onClick={onAccept}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('planBAccept')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-9 px-4"
            onClick={onClose}
          >
            {t('planBClose')}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Accepted state banner
function PlanBAcceptedBanner() {
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-0 my-2 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 flex items-start gap-3"
    >
      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-green-700 dark:text-green-400">{t('planBAccepted')}</p>
        <p className="text-xs text-green-600 dark:text-green-400/80 mt-0.5">{t('planBAcceptedDesc')}</p>
      </div>
    </motion.div>
  )
}

export function ItineraryTimeline({ stops, weatherAlert }: ItineraryTimelineProps) {
  const { t, language } = useLanguage()
  const affectedIds = weatherAlert?.affectedStops ?? []
  const [planBOpen, setPlanBOpen] = useState(false)
  const [planBAccepted, setPlanBAccepted] = useState(false)

  function handleAcceptPlanB() {
    setPlanBOpen(false)
    setPlanBAccepted(true)
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
      {/* Fixed header */}
      <div className="flex-none px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm text-foreground">{t('timelineTitle')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stops.length} {t('timelineSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium">
          <Zap className="w-3 h-3" />
          {t('gapFilled')}
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-0">
          {/* Weather alert banner */}
          {weatherAlert && !planBAccepted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-3 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-3"
            >
              <div className="flex items-start gap-2">
                <CloudRain className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                    {t('weatherAlertLabel')}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400/80 mt-0.5">
                    {weatherAlert.message}
                  </p>
                  {weatherAlert.planBGenerated && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPlanBOpen(v => !v)}
                      className="mt-2 h-7 text-xs px-3 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/40 rounded-lg gap-1.5"
                    >
                      <CloudRain className="w-3 h-3" />
                      {planBOpen ? t('hidePlanB') : t('viewPlanB')}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Plan B panel (inline, below weather banner) */}
          <AnimatePresence>
            {planBOpen && !planBAccepted && (
              <PlanBPanel
                affectedIds={affectedIds}
                onAccept={handleAcceptPlanB}
                onClose={() => setPlanBOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Plan B accepted banner */}
          <AnimatePresence>
            {planBAccepted && <PlanBAcceptedBanner />}
          </AnimatePresence>

          {/* Stops list */}
          {stops.map((stop, i) => (
            <div key={stop.landmark.id}>
              <StopCard
                stop={stop}
                index={i}
                isAffected={!planBAccepted && affectedIds.includes(stop.landmark.id)}
                onViewPlanB={() => setPlanBOpen(v => !v)}
                planBOpen={planBOpen}
                language={language}
              />
              {i < stops.length - 1 && (
                <TravelSegment
                  time={stops[i + 1].travelTime}
                  mode={stops[i + 1].transportMode}
                  language={language}
                />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
