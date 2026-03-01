'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Landmark } from '@/lib/types'
import { VIETNAM_LANDMARKS } from '@/lib/mock-data'

interface MapViewProps {
  selectedLandmarks: Landmark[]
  onToggleLandmark: (landmark: Landmark) => void
  focusedLandmarkId?: string
}

// Lightweight static map using SVG projection (no external map lib needed for mock)
function vietnamProject(lat: number, lng: number): { x: number; y: number } {
  // Rough bounding box: lat 8.5 - 23.5, lng 102.1 - 109.5
  const minLat = 8.5, maxLat = 23.5
  const minLng = 102.1, maxLng = 109.5
  const x = ((lng - minLng) / (maxLng - minLng)) * 100
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100
  return { x, y }
}

export function MapView({ selectedLandmarks, onToggleLandmark, focusedLandmarkId }: MapViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ landmark: Landmark; x: number; y: number } | null>(null)

  const isSelected = (id: string) => selectedLandmarks.some(l => l.id === id)

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-sky-50 to-background overflow-hidden rounded-xl border border-border">
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

          return (
            <motion.button
              key={landmark.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => onToggleLandmark(landmark)}
              onHoverStart={() => setHoveredId(landmark.id)}
              onHoverEnd={() => setHoveredId(null)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: focused ? 1.4 : hovered ? 1.2 : 1,
                opacity: 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: Math.random() * 0.3 }}
              aria-label={`${selected ? 'Remove' : 'Add'} ${landmark.nameEn} to itinerary`}
            >
              {/* Ripple for focused */}
              {focused && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/30"
                  animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}

              {/* Pin */}
              <div
                className={cn(
                  'relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg transition-colors duration-200',
                  selected
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-primary text-primary-foreground',
                  landmark.sourceVerified && !selected && 'ring-2 ring-accent/50'
                )}
              >
                <MapPin className="w-4 h-4 fill-current" />
                {landmark.sourceVerified && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border border-white" />
                )}
              </div>

              {/* Tooltip */}
              <AnimatePresence>
                {hovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none"
                  >
                    <div className="bg-foreground text-background text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl max-w-48">
                      <p className="font-semibold text-balance">{landmark.nameEn}</p>
                      <p className="opacity-70">{landmark.province}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          landmark.credibilityScore >= 90 ? 'bg-green-400' :
                          landmark.credibilityScore >= 75 ? 'bg-accent' : 'bg-orange-400'
                        )} />
                        <span className="opacity-80">{landmark.credibilityScore}/100</span>
                        {landmark.sourceVerified && (
                          <span className="ml-1 text-accent">✓ Verified</span>
                        )}
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-foreground rotate-45 mx-auto -mt-1" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border shadow-sm">
          <p className="text-xs font-semibold text-foreground mb-1.5">Map Legend</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-sm" />
              <span className="text-xs text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-accent border-2 border-white shadow-sm" />
              <span className="text-xs text-muted-foreground">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-4 h-4 rounded-full bg-primary border-2 border-white shadow-sm">
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full border border-white" />
              </div>
              <span className="text-xs text-muted-foreground">Source Verified</span>
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
            className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-semibold shadow-lg"
          >
            {selectedLandmarks.length} selected
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
