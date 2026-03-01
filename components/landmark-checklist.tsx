'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, MapPin, Star, ShieldCheck, Clock, CloudRain, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Landmark } from '@/lib/types'
import { VIETNAM_LANDMARKS } from '@/lib/mock-data'

interface LandmarkChecklistProps {
  selected: Landmark[]
  onToggle: (landmark: Landmark) => void
  onFocus: (id: string) => void
  focusedId?: string
}

const CATEGORY_ICONS: Record<string, string> = {
  temple: '🏛️',
  nature: '🌿',
  beach: '🏖️',
  museum: '🏺',
  food: '🍜',
  market: '🛒',
  cave: '🦇',
}

function CredibilityBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-accent' : 'bg-orange-400'
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      <span className="text-xs text-muted-foreground font-mono tabular-nums w-8">{score}</span>
    </div>
  )
}

export function LandmarkChecklist({ selected, onToggle, onFocus, focusedId }: LandmarkChecklistProps) {
  const isSelected = (id: string) => selected.some(l => l.id === id)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm text-foreground">Landmark Checklist</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Click to add to your itinerary</p>
          </div>
          <AnimatePresence>
            {selected.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-xs font-semibold">{selected.length}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {VIETNAM_LANDMARKS.map((landmark, index) => {
            const checked = isSelected(landmark.id)
            const focused = focusedId === landmark.id

            return (
              <motion.div
                key={landmark.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
              >
                <button
                  onClick={() => onToggle(landmark)}
                  onMouseEnter={() => onFocus(landmark.id)}
                  className={cn(
                    'w-full text-left rounded-xl p-3 transition-all duration-200 group border',
                    checked
                      ? 'bg-primary/8 border-primary/20'
                      : focused
                      ? 'bg-muted border-border'
                      : 'bg-card border-transparent hover:bg-muted hover:border-border'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Check icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      <AnimatePresence mode="wait">
                        {checked ? (
                          <motion.div
                            key="checked"
                            initial={{ scale: 0.5, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0.5, rotate: 90 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="unchecked"
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                          >
                            <Circle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={cn(
                            'text-sm font-semibold leading-tight truncate',
                            checked ? 'text-primary' : 'text-foreground'
                          )}>
                            {landmark.nameEn}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{landmark.name}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-1">
                          <span className="text-base leading-none">{CATEGORY_ICONS[landmark.category] ?? '📍'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5">
                        <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{landmark.province}</span>
                        {landmark.indoor ? (
                          <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4">Indoor</Badge>
                        ) : null}
                      </div>

                      <div className="mt-2 space-y-1">
                        <CredibilityBar score={landmark.credibilityScore} />
                        <div className="flex items-center gap-2">
                          {landmark.sourceVerified && (
                            <div className="flex items-center gap-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded px-1.5 py-0.5">
                              <ShieldCheck className="w-3 h-3" />
                              <span className="text-xs font-medium">Source Verified</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{landmark.duration}h</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="text-xs">{landmark.sources} sources</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
