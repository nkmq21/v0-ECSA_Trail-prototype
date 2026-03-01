'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { MapView } from '@/components/map-view'
import { LandmarkChecklist } from '@/components/landmark-checklist'
import { ChatPanel } from '@/components/chat-panel'
import { ItineraryTimeline } from '@/components/itinerary-timeline'
import type { Landmark } from '@/lib/types'
import { VIETNAM_LANDMARKS } from '@/lib/mock-data'
import { Map, MessageSquare, List, Sparkles, Loader2 } from 'lucide-react'
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
  const { t, language } = useLanguage()
  const [selectedLandmarks, setSelectedLandmarks] = useState<Landmark[]>([])
  const [focusedId, setFocusedId] = useState<string | undefined>()
  const [rightView, setRightView] = useState<PlannerView>('checklist')
  const [locationContext, setLocationContext] = useState<Landmark | null>(null)
  const [isReconfiguring, setIsReconfiguring] = useState(false)
  const [timelineStops, setTimelineStops] = useState(DEMO_STOPS)

  function handleToggleLandmark(landmark: Landmark) {
    setSelectedLandmarks(prev =>
      prev.some(l => l.id === landmark.id)
        ? prev.filter(l => l.id !== landmark.id)
        : [...prev, landmark]
    )
  }

  // Add landmark to timeline with AI reconfiguration simulation
  const handleAddToTimeline = useCallback((landmark: Landmark) => {
    // Check if already in timeline
    if (timelineStops.some(s => s.landmark.id === landmark.id)) return

    // Show reconfiguring state
    setIsReconfiguring(true)
    setRightView('timeline')

    // Simulate AI reconfiguration (would call real API in production)
    setTimeout(() => {
      setTimelineStops(prev => {
        // Calculate new order and insert at optimal position
        const newStop = {
          landmark,
          order: prev.length + 1,
          travelTime: Math.floor(Math.random() * 120) + 30, // Random 30-150 min
          transportMode: (['walk', 'taxi', 'motorbike', 'bus'] as const)[Math.floor(Math.random() * 4)],
          notes: `AI-optimized stop. ${landmark.sourceVerified ? 'Source verified location with high credibility.' : 'Added based on your selection.'}`,
        }
        
        // Recalculate orders
        const updated = [...prev, newStop].map((stop, i) => ({
          ...stop,
          order: i + 1,
        }))
        
        return updated
      })
      setIsReconfiguring(false)
    }, 1500)
  }, [timelineStops])

  // Send landmark to chat as context
  const handleSendToChat = useCallback((landmark: Landmark) => {
    setLocationContext(landmark)
    setRightView('chat')
  }, [])

  // Clear location context
  const handleClearLocationContext = useCallback(() => {
    setLocationContext(null)
  }, [])

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
              {t('aiReconfiguring')}
            </motion.div>
          )}
        </AnimatePresence>

        {!isReconfiguring && (
          <div className="ml-auto text-xs text-muted-foreground hidden md:block">
            {t('mapHint')}
          </div>
        )}
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
                onAddToTimeline={handleAddToTimeline}
                onSendToChat={handleSendToChat}
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
                      locationContext={locationContext}
                      onClearLocationContext={handleClearLocationContext}
                    />
                  )}
                  {rightView === 'timeline' && (
                    <ItineraryTimeline
                      stops={timelineStops}
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
      </div>
    </div>
  )
}
