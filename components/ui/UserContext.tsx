'use client'

import { createContext, useContext, useState } from 'react'

interface UserContextValue {
  name: string
  avatarInitials: string
  bio: string
  province: string
  verified: boolean
  joinedAt: string
  walletBalance: number
  ownedPlanIds: Set<string>
  purchasePlan: (planId: string, cost: number) => 'ok' | 'insufficient'
  topUpWallet: (amount?: number) => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [walletBalance, setWalletBalance] = useState(50.00)
  const [ownedPlanIds, setOwnedPlanIds] = useState<Set<string>>(new Set(['plan-4']))

  function purchasePlan(planId: string, cost: number): 'ok' | 'insufficient' {
    if (walletBalance < cost) return 'insufficient'
    setWalletBalance(prev => Math.round((prev - cost) * 100) / 100)
    setOwnedPlanIds(prev => new Set([...prev, planId]))
    return 'ok'
  }

  function topUpWallet(amount = 20) {
    setWalletBalance(prev => Math.round((prev + amount) * 100) / 100)
  }

  return (
    <UserContext.Provider value={{
      name: 'Alex Nguyen',
      avatarInitials: 'AN',
      bio: 'Passionate traveler discovering hidden gems across Vietnam. Coffee addict & sunset chaser.',
      province: 'Hà Nội',
      verified: false,
      joinedAt: 'September 2024',
      walletBalance,
      ownedPlanIds,
      purchasePlan,
      topUpWallet,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
