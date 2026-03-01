'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { MapView } from '@/components/map-view'
import { LandmarkChecklist } from '@/components/landmark-checklist'
import { ChatPanel } from '@/components/chat-panel'
import { ItineraryTimeline } from '@/components/itinerary-timeline'
import type { Landmark } from '@/lib/types'
import { VIETNAM_LANDMARKS } from '@/lib/mock-data'
import { Map, MessageSquare, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-context'

type PlannerView = 'checklist' | 'chat' | 'timeline'

// Demo itinerary stops
const DEMO_STOPS = [
  {
    landmark: VIETNAM_LANDMARKS[0], // Hoan Kiem
    order: 1, travelTime: 0, transportMode: 'walk' as const,
    notes: 'Start early at dawn for peaceful photos before crowds arrive. The Turtle Tower is best at sunrise.',
  },
  {
    landmark: VIETNAM_LANDMARKS[7], // Tam Coc
    order: 2, travelTime: 145, transportMode: 'taxi' as const,
    notes: 'Book boat in advance. Bring cash for tip. The 2-hour boat ride passes through 3 cave tunnels.',
  },
  {
    landmark: VIETNAM_LANDMARKS[2], // Hoi An Old Town
    order: 3, travelTime: 240, transportMode: 'bus' as const,
    notes: 'Evening lanterns light up after 6 PM. Get custom-tailored clothes — turnaround is 24–48 hours.',
  },
]

export function PlannerLayout() {
  const { t } = useLanguage()
  const [selectedLandmarks, setSelectedLandmarks] = useState<Landmark[]>([])
  const [focusedId, setFocusedId] = useState<string | undefined>()
  const [rightView, setRightView] = useState<PlannerView>('checklist')

  function handleToggleLandmark(landmark: Landmark) {
    setSelectedLandmarks(prev =>
      prev.some(l => l.id === landmark.id)
        ? prev.filter(l => l.id !== landmark.id)
        : [...prev, landmark]
    )
  }

  const RIGHT_VIEWS: { id: PlannerView; label: string; icon: React.ElementType }[] = [
    { id: 'checklist', label: t('viewChecklist'), icon: List },
    { id: 'chat', label: t('viewChat'), icon: MessageSquare },
    { id: 'timeline', label: t('viewTimeline'), icon: Map },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Right panel view switcher */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm">
        <span className="text-xs font-semibold text-muted-foreground mr-2 hidden sm:block">{t('viewLabel')}</span>
        {RIGHT_VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setRightView(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              rightView === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
        <div className="ml-auto text-xs text-muted-foreground hidden md:block">
          {t('mapHint')}
        </div>
      </div>

      {/* Split layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Map Panel */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <div className="h-full p-3">
              <MapView
                selectedLandmarks={selectedLandmarks}
                onToggleLandmark={handleToggleLandmark}
                focusedLandmarkId={focusedId}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel */}
          <ResizablePanel defaultSize={45} minSize={28}>
            <div className="h-full overflow-hidden bg-background border-l border-border">
              <AnimatePresence mode="wait">
                <motion.div
                  key={rightView}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {rightView === 'checklist' && (
                    <LandmarkChecklist
                      selected={selectedLandmarks}
                      onToggle={handleToggleLandmark}
                      onFocus={setFocusedId}
                      focusedId={focusedId}
                    />
                  )}
                  {rightView === 'chat' && (
                    <ChatPanel
                      selectedLandmarks={selectedLandmarks}
                    />
                  )}
                  {rightView === 'timeline' && (
                    <ItineraryTimeline
                      stops={DEMO_STOPS}
                      weatherAlert={{
                        type: 'rain',
                        severity: 'medium',
                        message: 'Rain expected at Tam Coc this afternoon. Consider moving the boat tour to morning.',
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
      </div>
    </div>
  )
}
