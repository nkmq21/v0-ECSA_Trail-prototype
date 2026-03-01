'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudRain, Sun, Zap, RefreshCw, CheckCircle2, AlertTriangle,
  Thermometer, Wind, Droplets, ArrowRight, Building2, TreePine
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VIETNAM_LANDMARKS } from '@/lib/mock-data'
import type { Landmark } from '@/lib/types'

type SimulationState = 'idle' | 'polling' | 'alert_detected' | 'generating_plan_b' | 'plan_b_ready'

interface PlanStop {
  landmark: Landmark
  reason?: string
}

const OUTDOOR_STOPS: PlanStop[] = [
  { landmark: VIETNAM_LANDMARKS[2] }, // Hoi An Old Town
  { landmark: VIETNAM_LANDMARKS[6] }, // Mui Ne Sand Dunes
  { landmark: VIETNAM_LANDMARKS[7] }, // Tam Coc
]

const INDOOR_ALTERNATIVES: PlanStop[] = [
  { landmark: VIETNAM_LANDMARKS[4], reason: 'Great indoor market, rain-friendly' }, // Ben Thanh Market
  { landmark: VIETNAM_LANDMARKS[3], reason: 'Cave system — unaffected by rain' },   // Son Doong Cave
  { landmark: VIETNAM_LANDMARKS[2], reason: 'Museums and tailoring shops inside Ancient Town' }, // Hoi An
]

const WEATHER_STEPS = [
  { label: 'Polling OpenWeatherMap API...', duration: 900 },
  { label: 'Comparing with stored Plan A...', duration: 700 },
  { label: 'Rain detected — severity: HIGH', duration: 600, isAlert: true },
  { label: 'Identifying affected outdoor stops...', duration: 800 },
  { label: 'Querying indoor alternatives (RAG)...', duration: 1000 },
  { label: 'Generating Plan B with Gemini...', duration: 1200 },
]

function WeatherCard({ temp, condition, humidity, wind }: {
  temp: number
  condition: string
  humidity: number
  wind: number
}) {
  return (
    <div className="bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">Hội An, Quảng Nam</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-4xl font-bold">{temp}°</span>
            <span className="text-sm opacity-80 mb-1.5">C</span>
          </div>
          <p className="text-sm mt-1 opacity-90">{condition}</p>
        </div>
        <CloudRain className="w-12 h-12 opacity-80" />
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-4 h-4 opacity-70" />
          <span className="text-sm">{humidity}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-4 h-4 opacity-70" />
          <span className="text-sm">{wind} km/h</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 opacity-70" />
          <span className="text-sm">Feels 21°C</span>
        </div>
      </div>
    </div>
  )
}

export function WeatherSimulation() {
  const [state, setState] = useState<SimulationState>('idle')
  const [currentStep, setCurrentStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  async function runSimulation() {
    setState('polling')
    setCurrentStep(0)
    setCompletedSteps([])

    for (let i = 0; i < WEATHER_STEPS.length; i++) {
      setCurrentStep(i)
      await new Promise(r => setTimeout(r, WEATHER_STEPS[i].duration))
      setCompletedSteps(prev => [...prev, i])
      if (i === 2) setState('alert_detected')
      if (i === 4) setState('generating_plan_b')
    }

    setState('plan_b_ready')
  }

  function reset() {
    setState('idle')
    setCurrentStep(-1)
    setCompletedSteps([])
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Autonomous Re-planning Simulation</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Simulate the weather alert trigger and automatic Plan B generation
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Current weather card */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Live Weather Snapshot</h3>
          <WeatherCard
            temp={23}
            condition="Heavy Rain — Tropical Storm Warning"
            humidity={88}
            wind={42}
          />
        </div>

        {/* Trigger button */}
        {state === 'idle' && (
          <Button
            onClick={runSimulation}
            className="w-full gap-2 h-12 rounded-xl font-semibold"
          >
            <CloudRain className="w-5 h-5" />
            Trigger Weather Alert Simulation
          </Button>
        )}

        {/* Processing steps */}
        <AnimatePresence>
          {state !== 'idle' && state !== 'plan_b_ready' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card border border-border rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="text-sm font-semibold text-foreground">System Processing...</span>
              </div>

              {WEATHER_STEPS.map((step, i) => {
                const isDone = completedSteps.includes(i)
                const isActive = currentStep === i && !isDone

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: i <= currentStep ? 1 : 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-shrink-0">
                      {isDone ? (
                        <CheckCircle2 className={cn(
                          'w-4 h-4',
                          step.isAlert ? 'text-orange-500' : 'text-green-500'
                        )} />
                      ) : isActive ? (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent"
                          style={{ borderTopColor: 'transparent' }}
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted" />
                      )}
                    </div>
                    <span className={cn(
                      'text-sm',
                      isActive ? 'text-foreground font-medium' :
                      isDone ? (step.isAlert ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-muted-foreground') :
                      'text-muted-foreground'
                    )}>
                      {step.label}
                    </span>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plan B Result */}
        <AnimatePresence>
          {state === 'plan_b_ready' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Alert banner */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                    Weather Alert — Plan B Generated
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400/80 mt-1">
                    Heavy rain detected for the next 6 hours. 3 outdoor stops have been automatically replaced with indoor alternatives.
                  </p>
                </div>
              </div>

              {/* Plan comparison */}
              <div className="grid grid-cols-2 gap-3">
                {/* Plan A */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-foreground">Plan A</span>
                    <Badge variant="secondary" className="text-xs ml-auto">Original</Badge>
                  </div>
                  <div className="space-y-2">
                    {OUTDOOR_STOPS.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 opacity-60">
                        <TreePine className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground line-through truncate">{s.landmark.nameEn}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan B */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CloudRain className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Plan B</span>
                    <Badge className="text-xs ml-auto bg-primary text-primary-foreground">AI Generated</Badge>
                  </div>
                  <div className="space-y-2">
                    {INDOOR_ALTERNATIVES.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Building2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-foreground truncate block">{s.landmark.nameEn}</span>
                          {s.reason && <span className="text-xs text-muted-foreground">{s.reason}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 gap-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  Accept Plan B
                </Button>
                <Button variant="outline" className="flex-1 gap-2 rounded-xl" onClick={reset}>
                  <RefreshCw className="w-4 h-4" />
                  Simulate Again
                </Button>
              </div>

              {/* Service Worker callout */}
              <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Service Worker Notification</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    In production, this Plan B would be pushed to the user via PWA push notification.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
