'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { MapView } from '@/components/maps/MapView'
import { LandmarkChecklist } from '@/components/maps/LandmarkChecklist'
import { ChatPanel } from '@/components/sections/chat/ChatPanel'
import { ItineraryTimeline } from '@/components/sections/itinerary/ItineraryTimeline'
import { WeatherSimulation } from '@/components/sections/itinerary/WeatherSimulation'
import type { Landmark, TravelPlan, ItineraryStop } from '@/lib/types'
import { VIETNAM_LANDMARKS } from '@/lib/mock-data'
import {
  Map, MessageSquare, List, Loader2, CloudLightning,
  CalendarDays, Package, CheckCircle, Clock, MapPin, Star,
  ChevronLeft, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/ui/LanguageContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Sub-tab type — Re-planning is nested here
type PlannerSubTab = 'map' | 'timeline' | 'chat' | 'replanning'

// Demo itinerary stops
const DEMO_STOPS = [
  {
    landmark: VIETNAM_LANDMARKS[0],
    order: 1, travelTime: 0, transportMode: 'walk' as const,
    notes: 'Start early at dawn for peaceful photos before crowds arrive. The Turtle Tower is best at sunrise.',
  },
  {
    landmark: VIETNAM_LANDMARKS[7],
    order: 2, travelTime: 145, transportMode: 'taxi' as const,
    notes: 'Book boat in advance. Bring cash for tip. The 2-hour boat ride passes through 3 cave tunnels.',
  },
  {
    landmark: VIETNAM_LANDMARKS[2],
    order: 3, travelTime: 240, transportMode: 'bus' as const,
    notes: 'Evening lanterns light up after 6 PM. Get custom-tailored clothes — turnaround is 24–48 hours.',
  },
]

interface PlannerLayoutProps {
  activePlan?: TravelPlan | null
  onClearActivePlan?: () => void
}

export function PlannerLayout({ activePlan, onClearActivePlan }: PlannerLayoutProps) {
  const { t, language } = useLanguage()
  const [selectedLandmarks, setSelectedLandmarks] = useState<Landmark[]>([])
  const [focusedId, setFocusedId] = useState<string | undefined>()
  const [subTab, setSubTab] = useState<PlannerSubTab>('map')
  const [locationContext, setLocationContext] = useState<Landmark | null>(null)
  const [isReconfiguring, setIsReconfiguring] = useState(false)
  const [timelineStops, setTimelineStops] = useState<ItineraryStop[]>(DEMO_STOPS)

  function handleToggleLandmark(landmark: Landmark) {
    setSelectedLandmarks(prev =>
      prev.some(l => l.id === landmark.id)
        ? prev.filter(l => l.id !== landmark.id)
        : [...prev, landmark]
    )
  }

  const handleAddToTimeline = useCallback((landmark: Landmark) => {
    if (timelineStops.some(s => s.landmark.id === landmark.id)) return
    setIsReconfiguring(true)
    setSubTab('timeline')
    setTimeout(() => {
      setTimelineStops(prev => {
        const newStop = {
          landmark,
          order: prev.length + 1,
          travelTime: Math.floor(Math.random() * 120) + 30,
          transportMode: (['walk', 'taxi', 'motorbike', 'bus'] as const)[Math.floor(Math.random() * 4)],
          notes: `AI-optimized stop. ${landmark.sourceVerified ? 'Source verified location with high credibility.' : 'Added based on your selection.'}`,
        }
        return [...prev, newStop].map((s, i) => ({ ...s, order: i + 1 }))
      })
      setIsReconfiguring(false)
    }, 1500)
  }, [timelineStops])

  const handleSendToChat = useCallback((landmark: Landmark) => {
    setLocationContext(landmark)
    setSubTab('chat')
  }, [])

  const handleClearLocationContext = useCallback(() => setLocationContext(null), [])

  const SUB_TABS: { id: PlannerSubTab; label: string; icon: React.ElementType; accent?: boolean }[] = [
    { id: 'map',        label: language === 'vi' ? 'Bản đồ' : 'Map',        icon: Map },
    { id: 'timeline',   label: language === 'vi' ? 'Lịch trình' : 'Timeline', icon: CalendarDays },
    { id: 'chat',       label: language === 'vi' ? 'AI Chat' : 'AI Chat',   icon: MessageSquare },
    { id: 'replanning', label: language === 'vi' ? 'Lập lại lộ trình' : 'Re-planning', icon: CloudLightning, accent: true },
  ]

  const stopsToUse = activePlan?.stops?.length
    ? activePlan.stops
    : timelineStops

  return (
    <div className="flex flex-col h-full">

      {/* Active plan context banner */}
      <AnimatePresence>
        {activePlan && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="flex-none overflow-hidden border-b border-border"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Package className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {language === 'vi' ? activePlan.titleVi : activePlan.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />{activePlan.duration} {t('planDays')}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />{activePlan.provinces.join(' · ')}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{activePlan.rating.toFixed(1)}
                  </span>
                  {activePlan.aiVerified && (
                    <Badge className="h-3.5 px-1 text-[9px] bg-primary/10 text-primary border-primary/20 rounded-full gap-0.5">
                      <Zap className="w-2 h-2" />AI Verified
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg flex-shrink-0"
                onClick={onClearActivePlan}
              >
                <ChevronLeft className="w-3 h-3 mr-1" />
                {language === 'vi' ? 'Chợ' : 'Back to Marketplace'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-tab bar */}
      <div className="flex-none flex items-center gap-0.5 px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm">
        {SUB_TABS.map(({ id, label, icon: Icon, accent }) => {
          const isActive = subTab === id
          return (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap',
                isActive
                  ? accent
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="planner-subtab-indicator"
                  className={cn(
                    'absolute inset-0 rounded-lg',
                    accent ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary/10'
                  )}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="relative w-3.5 h-3.5 flex-shrink-0" />
              <span className="relative hidden sm:block">{label}</span>
              {accent && !isActive && (
                <span className="relative hidden sm:flex h-1.5 w-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          )
        })}

        {/* Reconfiguring indicator */}
        <AnimatePresence>
          {isReconfiguring && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="ml-auto flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden sm:block">{t('aiReconfiguring')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {!isReconfiguring && subTab === 'map' && (
          <p className="ml-auto text-xs text-muted-foreground hidden md:block">{t('mapHint')}</p>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* Re-planning sub-tab: full width, no map split */}
          {subTab === 'replanning' && (
            <motion.div
              key="replanning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-auto"
            >
              <div className="max-w-2xl mx-auto px-4 py-2">
                <WeatherSimulation activePlan={activePlan ?? null} />
              </div>
            </motion.div>
          )}

          {/* Map-split views */}
          {subTab !== 'replanning' && (
            <motion.div
              key="map-split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={55} minSize={30}>
                  <div className="h-full p-3">
                    <MapView
                      selectedLandmarks={selectedLandmarks}
                      onToggleLandmark={handleToggleLandmark}
                      onAddToTimeline={handleAddToTimeline}
                      onSendToChat={handleSendToChat}
                      focusedLandmarkId={focusedId}
                    />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={45} minSize={28}>
                  <div className="h-full overflow-hidden bg-background border-l border-border">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={subTab}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.18 }}
                        className="h-full"
                      >
                        {subTab === 'map' && (
                          <LandmarkChecklist
                            selected={selectedLandmarks}
                            onToggle={handleToggleLandmark}
                            onFocus={setFocusedId}
                            focusedId={focusedId}
                          />
                        )}
                        {subTab === 'chat' && (
                          <ChatPanel
                            selectedLandmarks={selectedLandmarks}
                            locationContext={locationContext}
                            onClearLocationContext={handleClearLocationContext}
                          />
                        )}
                        {subTab === 'timeline' && (
                          <ItineraryTimeline
                            stops={stopsToUse}
                            weatherAlert={{
                              type: 'rain',
                              severity: 'medium',
                              message: language === 'vi'
                                ? 'Dự báo mưa tại Tam Cốc chiều nay. Cân nhắc chuyển chuyến thuyền sang buổi sáng.'
                                : 'Rain expected at Tam Coc this afternoon. Consider moving the boat tour to morning.',
                              affectedStops: [VIETNAM_LANDMARKS[7].id],
                              planBGenerated: true,
                            }}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
