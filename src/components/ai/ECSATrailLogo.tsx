'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  thinking?: boolean
  className?: string
}

export function ECSATrailLogo({ size = 32, thinking = false, className }: LogoProps) {
  return (
    <div
      className={cn('relative inline-flex items-center justify-center rounded-xl', className)}
      style={{ width: size, height: size }}
    >
      <motion.div
        className={cn('absolute inset-0 rounded-xl', thinking ? 'ecsa-thinking' : 'bg-primary')}
        animate={thinking ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        style={{ width: size * 0.6, height: size * 0.6 }}
      >
        {/* Trail path */}
        <path
          d="M5 12 C5 12, 8 7, 12 9 C16 11, 16 6, 19 7"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Location dot */}
        <circle cx="5" cy="12" r="1.5" fill="white" />
        {/* End arrow */}
        <circle cx="19" cy="7" r="1.5" fill="#FAB005" />
        {/* Compass tick */}
        <path d="M12 3 L12 5 M12 19 L12 21 M3 12 L5 12 M19 12 L21 12"
          stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    </div>
  )
}
