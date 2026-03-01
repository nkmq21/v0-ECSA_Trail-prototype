'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Plus, Minus, MessageSquare, Check, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Landmark } from '@/lib/types'
import { VIETNAM_LANDMARKS } from '@/lib/mock-data'
import { useLanguage } from '@/components/language-context'

interface MapViewProps {
  selectedLandmarks: Landmark[]
  onToggleLandmark: (landmark: Landmark) => void
  onAddToTimeline?: (landmark: Landmark) => void
  onSendToChat?: (landmark: Landmark) => void
  focusedLandmarkId?: string
}

// Lightweight static map using SVG projection (no external map lib needed for mock)
function vietnamProject(lat: number, lng: number): { x: number; y: number } {
  const minLat = 8.5, maxLat = 23.5
  const minLng = 102.1, maxLng = 109.5
  const x = ((lng - minLng) / (maxLng - minLng)) * 100
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100
  return { x, y }
}

// ─── Landmark Popup ──────────────────────────────────────────────────────────

function LandmarkPopup({
  landmark,
  isInTimeline,
  onAddToTimeline,
  onRemoveFromTimeline,
  onSendToChat,
  onClose,
  position,
}: {
  landmark: Landmark
  isInTimeline: boolean
  onAddToTimeline: () => void
  onRemoveFromTimeline: () => void
  onSendToChat: () => void
  onClose: () => void
  position: { x: number; y: number }
}) {
  const { t, language } = useLanguage()
  const displayName = language === 'vi' ? landmark.name : landmark.nameEn
  const [justAdded, setJustAdded] = useState(false)

  const handleAdd = () => {
    onAddToTimeline()
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)
  }

  // Determine popup position (flip if near edges)
  const popupLeft = position.x > 70 ? 'right-0' : position.x < 30 ? 'left-0' : 'left-1/2 -translate-x-1/2'
  const popupBottom = position.y < 40 ? 'top-full mt-2' : 'bottom-full mb-2'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: position.y < 40 ? -8 : 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: position.y < 40 ? -8 : 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'absolute z-30 w-64',
        popupLeft,
        popupBottom
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative px-4 py-3 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <div className="flex items-start gap-2.5 pr-6">
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
              isInTimeline ? 'bg-accent/20' : 'bg-primary/10'
            )}>
              <MapPin className={cn(
                'w-4 h-4',
                isInTimeline ? 'text-accent' : 'text-primary'
              )} />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-foreground leading-tight truncate">{displayName}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{landmark.province}</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-4 py-2.5 flex items-center justify-between text-xs border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                'w-2 h-2 rounded-full',
                landmark.credibilityScore >= 90 ? 'bg-green-500' :
                landmark.credibilityScore >= 75 ? 'bg-accent' : 'bg-orange-400'
              )} />
              <span className="text-muted-foreground tabular-nums">{landmark.credibilityScore}/100</span>
            </div>
            {landmark.sourceVerified && (
              <span className="text-green-600 dark:text-green-400 font-medium">{t('verified')}</span>
            )}
          </div>
          <span className="text-muted-foreground capitalize">{landmark.category}</span>
        </div>

        {/* Actions */}
        <div className="p-3 space-y-2">
          {/* Add/Remove from Timeline */}
          <AnimatePresence mode="wait">
            {justAdded ? (
              <motion.div
                key="added"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-center gap-2 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              >
                <Check className="w-4 h-4" />
                <span className="text-xs font-semibold">{t('addedToTimeline')}</span>
              </motion.div>
            ) : isInTimeline ? (
              <motion.div key="remove" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRemoveFromTimeline}
                  className="w-full h-9 rounded-xl text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <Minus className="w-3.5 h-3.5" />
                  {t('removeFromTimeline')}
                </Button>
              </motion.div>
            ) : (
              <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  className="w-full h-9 rounded-xl text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('addToTimeline')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Send to Chat */}
          <Button
            size="sm"
            variant="secondary"
            onClick={onSendToChat}
            className="w-full h-9 rounded-xl text-xs gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {t('sendToChat')}
          </Button>
        </div>
      </div>

      {/* Arrow pointing to marker */}
      <div className={cn(
        'absolute w-3 h-3 bg-card border-border rotate-45',
        position.y < 40 
          ? '-top-1.5 border-t border-l' 
          : '-bottom-1.5 border-b border-r',
        position.x > 70 ? 'right-6' : position.x < 30 ? 'left-6' : 'left-1/2 -translate-x-1/2'
      )} />
    </motion.div>
  )
}

// ─── Main Map Component ──────────────────────────────────────────────────────

export function MapView({ 
  selectedLandmarks, 
  onToggleLandmark, 
  onAddToTimeline,
  onSendToChat,
  focusedLandmarkId 
}: MapViewProps) {
  const { t, language } = useLanguage()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [activePopupId, setActivePopupId] = useState<string | null>(null)

  const isSelected = (id: string) => selectedLandmarks.some(l => l.id === id)

  const handleMarkerClick = useCallback((landmark: Landmark) => {
    if (activePopupId === landmark.id) {
      setActivePopupId(null)
    } else {
      setActivePopupId(landmark.id)
    }
  }, [activePopupId])

  const handleAddToTimeline = useCallback((landmark: Landmark) => {
    if (!isSelected(landmark.id)) {
      onToggleLandmark(landmark)
    }
    onAddToTimeline?.(landmark)
  }, [onToggleLandmark, onAddToTimeline, selectedLandmarks])

  const handleRemoveFromTimeline = useCallback((landmark: Landmark) => {
    if (isSelected(landmark.id)) {
      onToggleLandmark(landmark)
    }
  }, [onToggleLandmark, selectedLandmarks])

  const handleSendToChat = useCallback((landmark: Landmark) => {
    onSendToChat?.(landmark)
    setActivePopupId(null)
  }, [onSendToChat])

  // Close popup when clicking outside
  const handleBackgroundClick = useCallback(() => {
    setActivePopupId(null)
  }, [])

  return (
    <div 
      className="relative w-full h-full bg-gradient-to-b from-sky-50 to-background overflow-hidden rounded-xl border border-border"
      onClick={handleBackgroundClick}
    >
      {/* Map background grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--primary)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Vietnam outline (simplified SVG) */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-10"
      >
        <path
          d="M 45 5 L 55 8 L 62 15 L 65 22 L 70 28 L 68 38 L 72 45 L 70 55 L 65 60 L 62 68 L 58 75 L 55 82 L 50 90 L 45 95 L 40 88 L 38 80 L 35 72 L 30 65 L 28 58 L 32 50 L 30 42 L 35 35 L 38 28 L 40 18 Z"
          fill="var(--primary)"
          stroke="var(--primary)"
          strokeWidth="0.5"
        />
      </svg>

      {/* Landmark markers */}
      <div className="absolute inset-0">
        {VIETNAM_LANDMARKS.map((landmark) => {
          const { x, y } = vietnamProject(landmark.lat, landmark.lng)
          const selected = isSelected(landmark.id)
          const focused = focusedLandmarkId === landmark.id
          const hovered = hoveredId === landmark.id
          const hasPopup = activePopupId === landmark.id

          return (
            <motion.div
              key={landmark.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${x}%`, top: `${y}%` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: focused || hasPopup ? 1.3 : hovered ? 1.15 : 1,
                opacity: 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: Math.random() * 0.3 }}
            >
              {/* Ripple for focused */}
              {focused && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/30"
                  animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}

              {/* Pin button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleMarkerClick(landmark)
                }}
                onMouseEnter={() => setHoveredId(landmark.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                aria-label={`${selected ? 'Selected' : 'Select'} ${landmark.nameEn}`}
              >
                <div
                  className={cn(
                    'relative flex items-center justify-center w-9 h-9 rounded-full border-2 border-white shadow-lg transition-colors duration-200',
                    selected
                      ? 'bg-accent text-accent-foreground'
                      : hasPopup
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                        : 'bg-primary text-primary-foreground',
                    landmark.sourceVerified && !selected && 'ring-2 ring-accent/50'
                  )}
                >
                  <MapPin className="w-4 h-4 fill-current" />
                  {landmark.sourceVerified && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border border-white" />
                  )}
                </div>
              </button>

              {/* Hover tooltip (only when no popup) */}
              <AnimatePresence>
                {hovered && !hasPopup && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none"
                  >
                    <div className="bg-foreground text-background text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl max-w-48">
                      <p className="font-semibold text-balance">{language === 'vi' ? landmark.name : landmark.nameEn}</p>
                      <p className="opacity-70">{landmark.province}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          landmark.credibilityScore >= 90 ? 'bg-green-400' :
                          landmark.credibilityScore >= 75 ? 'bg-accent' : 'bg-orange-400'
                        )} />
                        <span className="opacity-80">{landmark.credibilityScore}/100</span>
                        {landmark.sourceVerified && (
                          <span className="ml-1 text-accent">✓</span>
                        )}
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-foreground rotate-45 mx-auto -mt-1" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action popup */}
              <AnimatePresence>
                {hasPopup && (
                  <LandmarkPopup
                    landmark={landmark}
                    isInTimeline={selected}
                    onAddToTimeline={() => handleAddToTimeline(landmark)}
                    onRemoveFromTimeline={() => handleRemoveFromTimeline(landmark)}
                    onSendToChat={() => handleSendToChat(landmark)}
                    onClose={() => setActivePopupId(null)}
                    position={{ x, y }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border shadow-sm">
          <p className="text-xs font-semibold text-foreground mb-1.5">{language === 'vi' ? 'Chú giải' : 'Map Legend'}</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-sm" />
              <span className="text-xs text-muted-foreground">{language === 'vi' ? 'Có sẵn' : 'Available'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-accent border-2 border-white shadow-sm" />
              <span className="text-xs text-muted-foreground">{language === 'vi' ? 'Đã chọn' : 'In Timeline'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-4 h-4 rounded-full bg-primary border-2 border-white shadow-sm">
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full border border-white" />
              </div>
              <span className="text-xs text-muted-foreground">{t('sourceVerified')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected count badge */}
      <AnimatePresence>
        {selectedLandmarks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-sm font-semibold shadow-lg flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {selectedLandmarks.length} {language === 'vi' ? 'địa điểm' : 'in timeline'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
