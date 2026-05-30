'use client'

import { motion } from 'framer-motion'
import { FrequencyDashboard } from '@/components/sections/my-plans/FrequencyDashboard'

export default function MyPlansPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="h-full overflow-auto"
    >
      <div className="max-w-5xl mx-auto">
        <FrequencyDashboard />
      </div>
    </motion.div>
  )
}
