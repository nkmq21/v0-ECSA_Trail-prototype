'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavBar, type AppTab } from '@/components/nav-bar'
import { PlannerLayout } from '@/components/planner-layout'
import { FrequencyDashboard } from '@/components/frequency-dashboard'
import { WeatherSimulation } from '@/components/weather-simulation'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function ECSATrailApp() {
  const [activeTab, setActiveTab] = useState<AppTab>('planner')

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-hidden" role="main">
        <AnimatePresence mode="wait">
          {activeTab === 'planner' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full"
            >
              <PlannerLayout />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full overflow-auto"
            >
              <div className="max-w-5xl mx-auto">
                <FrequencyDashboard />
              </div>
            </motion.div>
          )}

          {activeTab === 'weather' && (
            <motion.div
              key="weather"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full overflow-auto"
            >
              <div className="max-w-2xl mx-auto">
                <WeatherSimulation />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
