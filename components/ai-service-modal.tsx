'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Zap, Crown, ShoppingCart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-context'
import { AI_SERVICE_TIERS } from '@/lib/mock-data'
import type { TravelPlan, AiServiceTier } from '@/lib/types'

interface AiServiceModalProps {
  open: boolean
  plan: TravelPlan | null
  onComplete: (tier: AiServiceTier | null) => void
  onClose: () => void
}

export function AiServiceModal({ open, plan, onComplete, onClose }: AiServiceModalProps) {
  const { t, language } = useLanguage()
  const [selected, setSelected] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  function handleConfirm() {
    setConfirmed(true)
    setTimeout(() => {
      const tier = selected ? AI_SERVICE_TIERS.find(t => t.id === selected) ?? null : null
      onComplete(tier)
      setConfirmed(false)
      setSelected(null)
    }, 1400)
  }

  const planTitle = plan ? (language === 'vi' ? plan.titleVi : plan.title) : ''
  const totalPrice = plan
    ? plan.price + (selected ? (AI_SERVICE_TIERS.find(t => t.id === selected)?.price ?? 0) : 0)
    : 0

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="flex-none p-6 pb-4 border-b border-border">
          <div className="pr-8">
            <DialogTitle className="text-lg font-bold">{t('aiServiceTitle')}</DialogTitle>
            <DialogDescription className="mt-1 text-sm">
              {planTitle && <><span className="font-medium text-foreground">{planTitle}</span> · </>}
              {t('aiServiceDesc')}
            </DialogDescription>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {confirmed ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 px-6 gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
              >
                <Check className="w-8 h-8 text-green-600" />
              </motion.div>
              <div className="text-center">
                <h3 className="font-bold text-lg text-foreground">Purchase Complete</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {planTitle} has been added to your plans.
                  {selected && ' AI service activated.'}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tiers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-6 space-y-4">
                {/* Skip AI option */}
                <button
                  onClick={() => setSelected(null)}
                  className={cn(
                    'w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all',
                    selected === null
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      selected === null ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}>
                      {selected === null && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Plan only — no AI service</p>
                      <p className="text-xs text-muted-foreground">You can add AI later from your dashboard</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">${plan?.price.toFixed(2)}</span>
                </button>

                {/* AI Tiers */}
                {AI_SERVICE_TIERS.map(tier => {
                  const label = language === 'vi' ? tier.labelVi : tier.label
                  const features = language === 'vi' ? tier.featuresVi : tier.features
                  const memory = language === 'vi' ? tier.memoryVi : tier.memory
                  const context = language === 'vi' ? tier.contextVi : tier.context
                  const isSelected = selected === tier.id

                  return (
                    <motion.button
                      key={tier.id}
                      onClick={() => setSelected(tier.id)}
                      layout
                      className={cn(
                        'w-full flex flex-col p-4 rounded-xl border text-left transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border bg-card hover:border-muted-foreground/30',
                        tier.recommended && !isSelected && 'border-primary/40'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                          )}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {tier.id === 'per-plan' ? (
                                <Zap className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Crown className="w-4 h-4 text-primary" />
                              )}
                              <span className="text-sm font-semibold text-foreground">{label}</span>
                              {tier.recommended && (
                                <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-bold">
                                  {t('aiRecommended')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              +${tier.price.toFixed(2)} <span className="text-muted-foreground/70">{tier.priceLabel}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Memory & context */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 ml-8">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{t('aiMemory')}</p>
                          <p className="text-xs text-foreground leading-relaxed">{memory}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{t('aiContext')}</p>
                          <p className="text-xs text-foreground leading-relaxed">{context}</p>
                        </div>
                      </div>

                      {/* Features */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-8 space-y-1.5 overflow-hidden"
                          >
                            {features.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                {f}
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )
                })}
                </div>
              </ScrollArea>

              {/* Footer — fixed outside scroll */}
              <div className="flex-none border-t border-border p-5 flex items-center justify-between gap-4 bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-foreground">${totalPrice.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={onClose} className="rounded-lg">
                    Cancel
                  </Button>
                  <Button onClick={handleConfirm} size="default" className="rounded-lg gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    {t('buyNow')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
