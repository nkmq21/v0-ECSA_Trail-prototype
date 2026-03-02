'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudRain, Sun, Zap, RefreshCw, CheckCircle2, AlertTriangle,
  Thermometer, Wind, Droplets, Building2, TreePine
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VIETNAM_LANDMARKS } from '@/lib/mock-data'
import { useLanguage } from '@/components/language-context'
import type { Landmark, TravelPlan } from '@/lib/types'

type SimulationState = 'idle' | 'polling' | 'alert_detected' | 'generating_plan_b' | 'plan_b_ready' | 'plan_b_accepted'

interface PlanStop {
  landmark: Landmark
  reason?: string
  reasonVi?: string
}

const OUTDOOR_STOPS: PlanStop[] = [
  { landmark: VIETNAM_LANDMARKS[2] }, // Hoi An Old Town
  { landmark: VIETNAM_LANDMARKS[6] }, // Mui Ne Sand Dunes
  { landmark: VIETNAM_LANDMARKS[7] }, // Tam Coc
]

const INDOOR_ALTERNATIVES: PlanStop[] = [
  {
    landmark: VIETNAM_LANDMARKS[4],
    reason: 'Great indoor market, rain-friendly',
    reasonVi: 'Chợ trong nhà, phù hợp khi mưa',
  },
  {
    landmark: VIETNAM_LANDMARKS[3],
    reason: 'Cave system — unaffected by rain',
    reasonVi: 'Hệ thống hang động — không bị ảnh hưởng bởi mưa',
  },
  {
    landmark: VIETNAM_LANDMARKS[2],
    reason: 'Museums and tailoring shops inside Ancient Town',
    reasonVi: 'Bảo tàng và cửa hàng may mặc trong Phố Cổ',
  },
]

const WEATHER_STEPS_EN = [
  { label: 'Polling OpenWeatherMap API...', duration: 900 },
  { label: 'Comparing with stored Plan A...', duration: 700 },
  { label: 'Rain detected — severity: HIGH', duration: 600, isAlert: true },
  { label: 'Identifying affected outdoor stops...', duration: 800 },
  { label: 'Querying indoor alternatives (RAG)...', duration: 1000 },
  { label: 'Generating Plan B with Gemini...', duration: 1200 },
]

const WEATHER_STEPS_VI = [
  { label: 'Đang lấy dữ liệu OpenWeatherMap API...', duration: 900 },
  { label: 'So sánh với Kế hoạch A đã lưu...', duration: 700 },
  { label: 'Phát hiện mưa — mức độ: CAO', duration: 600, isAlert: true },
  { label: 'Xác định các điểm ngoài trời bị ảnh hưởng...', duration: 800 },
  { label: 'Tìm kiếm địa điểm trong nhà (RAG)...', duration: 1000 },
  { label: 'Đang tạo Kế hoạch B với Gemini...', duration: 1200 },
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

export function WeatherSimulation({ activePlan }: { activePlan?: TravelPlan | null }) {
  const { t, language } = useLanguage()
  const [state, setState] = useState<SimulationState>('idle')
  const [currentStep, setCurrentStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const WEATHER_STEPS = language === 'vi' ? WEATHER_STEPS_VI : WEATHER_STEPS_EN

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

  function handleAcceptPlanB() {
    setState('plan_b_accepted')
  }

  function reset() {
    setState('idle')
    setCurrentStep(-1)
    setCompletedSteps([])
  }

  const weatherCondition = language === 'vi'
    ? 'Mưa to — Cảnh báo bão nhiệt đới'
    : 'Heavy Rain — Tropical Storm Warning'

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex-none px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
              <h2 className="font-semibold text-foreground">{t('weatherTitle')}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activePlan
                  ? (language === 'vi' ? activePlan.titleVi : activePlan.title)
                  : t('weatherSubtitle')}
              </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 space-y-5">
          {/* Weather card */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t('weatherSnapshot')}</h3>
            <WeatherCard
              temp={23}
              condition={weatherCondition}
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
              {t('triggerSimulation')}
            </Button>
          )}

          {/* Processing steps */}
          <AnimatePresence>
            {(state === 'polling' || state === 'alert_detected' || state === 'generating_plan_b') && (
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
                  <span className="text-sm font-semibold text-foreground">{t('systemProcessing')}</span>
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
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <RefreshCw className="w-4 h-4 text-primary" />
                          </motion.div>
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
                      {t('weatherAlertGenerated')}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400/80 mt-1">
                      {t('weatherAlertDetail')}
                    </p>
                  </div>
                </div>

                {/* Plan comparison */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Plan A */}
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sun className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold text-foreground">{t('planALabel')}</span>
                      <Badge variant="secondary" className="text-xs ml-auto">{t('originalLabel')}</Badge>
                    </div>
                    <div className="space-y-2">
                      {OUTDOOR_STOPS.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 opacity-60">
                          <TreePine className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground line-through truncate">
                            {language === 'vi' ? s.landmark.name : s.landmark.nameEn}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan B */}
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CloudRain className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">{t('planBLabel')}</span>
                      <Badge className="text-xs ml-auto bg-primary text-primary-foreground">
                        {t('aiGeneratedLabel')}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {INDOOR_ALTERNATIVES.map((s, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Building2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-foreground truncate block">
                              {language === 'vi' ? s.landmark.name : s.landmark.nameEn}
                            </span>
                            {s.reason && (
                              <span className="text-xs text-muted-foreground">
                                {language === 'vi' ? s.reasonVi : s.reason}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    className="flex-1 gap-2 rounded-xl"
                    onClick={handleAcceptPlanB}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {t('acceptPlanB')}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 rounded-xl"
                    onClick={reset}
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t('simulateAgain')}
                  </Button>
                </div>

                {/* Service Worker callout */}
                <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t('swNotification')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('swNotificationDesc')}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Accepted state */}
          <AnimatePresence>
            {state === 'plan_b_accepted' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Success banner */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 flex items-start gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">{t('planBAccepted')}</p>
                    <p className="text-sm text-green-600 dark:text-green-400/80 mt-1">{t('planBAcceptedDesc')}</p>
                  </div>
                </div>

                {/* Active plan B summary */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CloudRain className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">{t('planBLabel')} — Active</span>
                    <Badge className="text-xs ml-auto bg-primary text-primary-foreground">
                      {t('aiGeneratedLabel')}
                    </Badge>
                  </div>
                  <div className="space-y-2.5">
                    {INDOOR_ALTERNATIVES.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.08 }}
                        className="flex items-start gap-2"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">{i + 1}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {language === 'vi' ? s.landmark.name : s.landmark.nameEn}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'vi' ? s.reasonVi : s.reason}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Service Worker callout */}
                <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t('swNotification')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('swNotificationDesc')}</p>
                  </div>
                </div>

                {/* Simulate again */}
                <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={reset}>
                  <RefreshCw className="w-4 h-4" />
                  {t('simulateAgain')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  )
}
