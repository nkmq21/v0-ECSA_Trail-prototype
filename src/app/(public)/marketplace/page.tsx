'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Marketplace } from '@/components/sections/marketplace/Marketplace'
import type { TravelPlan } from '@/lib/types'

export default function MarketplacePage() {
  const router = useRouter()

  function handleOpenInPlanner(plan: TravelPlan) {
    router.push(`/dashboard/itinerary?planId=${plan.id}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="h-full overflow-auto"
    >
      <Marketplace onOpenInPlanner={handleOpenInPlanner} />
    </motion.div>
  )
}
