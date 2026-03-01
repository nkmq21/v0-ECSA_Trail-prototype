'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Navigation, MapPin, Footprints, Car, Bike, Bus,
  ShieldCheck, ChevronDown, ChevronUp, Zap, CloudRain
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Landmark } from '@/lib/types'

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

const TRANSPORT_LABELS = {
  walk: 'Walk',
  taxi: 'Taxi',
  motorbike: 'Motorbike',
  bus: 'Bus',
}

function TravelSegment({ time, mode }: { time: number; mode: 'walk' | 'taxi' | 'motorbike' | 'bus' }) {
  const Icon = TRANSPORT_ICONS[mode]
  return (
    <div className="flex items-center gap-2 py-2 pl-8">
      <div className="relative w-0.5 h-8 bg-border mx-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-full p-1">
          <Icon className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{time} min · {TRANSPORT_LABELS[mode]}</span>
    </div>
  )
}

function StopCard({ stop, index, isAffected }: { stop: Stop; index: number; isAffected: boolean }) {
  const [expanded, setExpanded] = useState(false)

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
            <h4 className="font-semibold text-sm text-foreground leading-tight">{stop.landmark.nameEn}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{stop.landmark.name}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{stop.landmark.province}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{stop.landmark.duration}h suggested</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {stop.landmark.sourceVerified && (
              <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-xs font-medium">Verified</span>
              </div>
            )}
            <Badge variant="secondary" className="text-xs capitalize">
              {stop.landmark.category}
            </Badge>
          </div>
        </div>

        {/* Credibility score */}
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

        {/* Notes expandable */}
        {stop.notes && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide tips' : 'Show tips'}
          </button>
        )}
        <AnimatePresence>
          {expanded && stop.notes && (
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

        {isAffected && (
          <div className="mt-2 flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <CloudRain className="w-3 h-3" />
            <span className="text-xs font-medium">Weather alert — see Plan B</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Demo stops using mock landmarks
export function ItineraryTimeline({ stops, weatherAlert }: ItineraryTimelineProps) {
  const affectedIds = weatherAlert?.affectedStops ?? []

  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Navigation className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">No itinerary yet</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed text-balance">
            Select landmarks on the map or ask the AI planner to generate your route.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm text-foreground">Itinerary Timeline</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{stops.length} stops · AI-optimized route</p>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium">
          <Zap className="w-3 h-3" />
          Gap-filled
        </div>
      </div>

      {weatherAlert && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mx-4 mt-3 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-3"
        >
          <div className="flex items-start gap-2">
            <CloudRain className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Weather Alert</p>
              <p className="text-xs text-orange-600 dark:text-orange-400/80 mt-0.5">{weatherAlert.message}</p>
              {weatherAlert.planBGenerated && (
                <Button size="sm" variant="outline" className="mt-2 h-6 text-xs px-2 border-orange-300 text-orange-700 hover:bg-orange-100">
                  View Plan B
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="p-4 space-y-0">
        {stops.map((stop, i) => (
          <div key={stop.landmark.id}>
            <StopCard
              stop={stop}
              index={i}
              isAffected={affectedIds.includes(stop.landmark.id)}
            />
            {i < stops.length - 1 && (
              <TravelSegment time={stops[i + 1].travelTime} mode={stops[i + 1].transportMode} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
