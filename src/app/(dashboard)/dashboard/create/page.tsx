'use client'

import { motion } from 'framer-motion'
import { CreatorStudio } from '@/components/sections/create/CreatorStudio'

export default function CreatePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="h-full overflow-hidden"
    >
      <CreatorStudio />
    </motion.div>
  )
}
