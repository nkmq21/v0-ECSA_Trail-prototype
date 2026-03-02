'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavBar, type AppTab } from '@/components/nav-bar'
import { PlannerLayout } from '@/components/planner-layout'
import { FrequencyDashboard } from '@/components/frequency-dashboard'
import { WeatherSimulation } from '@/components/weather-simulation'
import { Marketplace } from '@/components/marketplace'
import { CreatorStudio } from '@/components/creator-studio'
import { LanguageProvider } from '@/components/language-context'

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export default function ECSATrailApp() {
  const [activeTab, setActiveTab] = useState<AppTab>('marketplace')

  return (
    <LanguageProvider>
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <NavBar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 overflow-hidden" role="main">
          <AnimatePresence mode="wait">

            {activeTab === 'marketplace' && (
              <motion.div
                key="marketplace"
                variants={PAGE_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="h-full overflow-auto"
              >
                <Marketplace />
              </motion.div>
            )}

            {activeTab === 'creator' && (
              <motion.div
                key="creator"
                variants={PAGE_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="h-full overflow-hidden"
              >
                <CreatorStudio />
              </motion.div>
            )}

            {activeTab === 'planner' && (
              <motion.div
                key="planner"
                variants={PAGE_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="h-full"
              >
                <PlannerLayout />
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                variants={PAGE_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
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
                variants={PAGE_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
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
    </LanguageProvider>
  )
}
