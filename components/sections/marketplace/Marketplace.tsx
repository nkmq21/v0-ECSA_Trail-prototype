'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Star, ShoppingCart, CheckCircle, MapPin, Clock, Users, Zap,
  TrendingUp, Shield, ChevronRight, X, BadgeCheck, AlertCircle, Building2,
  SlidersHorizontal, ArrowUpDown, Package, ExternalLink, Wallet, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/ui/LanguageContext'
import { MOCK_PLANS, MOCK_REVIEWS, AI_SERVICE_TIERS } from '@/lib/mock-data'
import type { TravelPlan, AiServiceTier } from '@/lib/types'
import { AiServiceModal } from '@/components/sections/marketplace/AiServiceModal'
import { useUser } from '@/components/ui/UserContext'

type SortKey = 'featured' | 'top-rated' | 'best-selling' | 'newest' | 'price-low'
type CategoryFilter = 'all' | 'cultural' | 'nature' | 'adventure' | 'food' | 'city' | 'beach'

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-green-50 text-green-700 border-green-200',
  moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  challenging: 'bg-red-50 text-red-700 border-red-200',
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <span className={cn('flex items-center gap-0.5', size === 'md' ? 'text-sm' : 'text-xs')}>
      <Star className={cn('fill-amber-400 text-amber-400', size === 'md' ? 'w-4 h-4' : 'w-3 h-3')} />
      <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
    </span>
  )
}

function CreatorAvatar({ creator }: { creator: TravelPlan['creator'] }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
        {creator.avatar}
      </div>
      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{creator.name}</span>
      {creator.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
    </div>
  )
}

function PlanCard({
  plan,
  owned,
  onBuy,
  onOpenDetail,
}: {
  plan: TravelPlan
  owned: boolean
  onBuy: (plan: TravelPlan) => void
  onOpenDetail: (plan: TravelPlan) => void
}) {
  const { t, language } = useLanguage()
  const title = language === 'vi' ? plan.titleVi : plan.title

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer"
      onClick={() => onOpenDetail(plan)}
    >
      {/* Cover image strip */}
      <div className="relative h-36 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-end p-3">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {plan.originalPrice && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              SALE
            </span>
          )}
          {plan.aiVerified && (
            <span className="bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> AI Verified
            </span>
          )}
        </div>
        {owned && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" /> {t('planOwned')}
          </div>
        )}
        {/* Province */}
        <div className="relative flex items-center gap-1 text-white text-xs font-medium">
          <MapPin className="w-3 h-3" />
          {plan.provinces.slice(0, 2).join(' · ')}
          {plan.provinces.length > 2 && ` +${plan.provinces.length - 2}`}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Title */}
        <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Creator */}
        <CreatorAvatar creator={plan.creator} />

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <StarRating rating={plan.rating} />
          <span>({plan.reviewCount})</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />{plan.duration} {t('planDays')}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />{plan.purchaseCount}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {plan.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
              {tag}
            </span>
          ))}
        </div>

        {/* Difficulty */}
        <span className={cn('self-start text-[10px] font-semibold px-2 py-0.5 rounded-full border', DIFFICULTY_COLOR[plan.difficulty])}>
          {plan.difficulty.charAt(0).toUpperCase() + plan.difficulty.slice(1)}
        </span>

        <div className="flex-1" />

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
          <div>
            <span className="text-lg font-bold text-foreground">${plan.price.toFixed(2)}</span>
            {plan.originalPrice && (
              <span className="text-xs text-muted-foreground line-through ml-1.5">${plan.originalPrice.toFixed(2)}</span>
            )}
          </div>
          <Button
            size="sm"
            variant={owned ? 'outline' : 'default'}
            className="h-8 text-xs px-3 rounded-lg"
            onClick={e => { e.stopPropagation(); if (!owned) onBuy(plan) }}
            disabled={owned}
          >
            {owned ? (
              <><CheckCircle className="w-3 h-3 mr-1" />{t('planOwned')}</>
            ) : (
              <><ShoppingCart className="w-3 h-3 mr-1" />{t('planBuy')}</>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function PlanDetailModal({
  plan,
  open,
  onClose,
  owned,
  onBuy,
  onOpenInPlanner,
}: {
  plan: TravelPlan | null
  open: boolean
  onClose: () => void
  owned: boolean
  onBuy: (plan: TravelPlan) => void
  onOpenInPlanner: (plan: TravelPlan) => void
}) {
  const { t, language } = useLanguage()
  if (!plan) return null
  const title = language === 'vi' ? plan.titleVi : plan.title
  const highlights = language === 'vi' ? plan.highlightsVi : plan.highlights

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="relative flex-none p-6 pb-4 border-b border-border">
          <div className="flex items-start gap-4 pr-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className="text-[10px]">{plan.category}</Badge>
                <Badge variant="outline" className={cn('text-[10px]', DIFFICULTY_COLOR[plan.difficulty])}>{plan.difficulty}</Badge>
                {plan.aiVerified && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]"><Zap className="w-2.5 h-2.5 mr-1" />AI Verified</Badge>}
              </div>
              <DialogTitle className="text-xl font-bold leading-tight">{title}</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-3 text-xs flex-wrap">
                <CreatorAvatar creator={plan.creator} />
                <span>·</span>
                <StarRating rating={plan.rating} size="md" />
                <span className="text-muted-foreground">({plan.reviewCount} {t('planReviews')})</span>
              </DialogDescription>
            </div>
          </div>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Clock, label: t('planDays'), value: `${plan.duration}d` },
                { icon: Users, label: t('planPurchases'), value: plan.purchaseCount },
                { icon: MapPin, label: 'Provinces', value: plan.provinces.length },
                { icon: Star, label: t('avgRating'), value: plan.rating.toFixed(1) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-card border border-border rounded-lg p-3 text-center">
                  <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                  <div className="text-base font-bold text-foreground">{value}</div>
                  <div className="text-[10px] text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>

            {/* Highlights */}
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">{t('planHighlights')}</h4>
              <ul className="space-y-2">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Includes */}
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">{t('planIncludes')}</h4>
              <div className="flex flex-wrap gap-2">
                {plan.includesTransport && <div className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-2.5 py-1.5"><CheckCircle className="w-3.5 h-3.5" />{t('planTransport')}</div>}
                {plan.includesTips && <div className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-2.5 py-1.5"><CheckCircle className="w-3.5 h-3.5" />{t('planTips')}</div>}
                {plan.includesMedia && <div className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-2.5 py-1.5"><CheckCircle className="w-3.5 h-3.5" />{t('planMedia')}</div>}
                {plan.aiVerified && <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 py-1.5"><Zap className="w-3.5 h-3.5" />{t('planAiVerified')}</div>}
                {plan.factChecked && <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 py-1.5"><Shield className="w-3.5 h-3.5" />{t('planFactChecked')}</div>}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">Reviews</h4>
              <div className="space-y-3">
                {MOCK_REVIEWS.map(r => (
                  <div key={r.id} className="bg-muted/40 rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{r.avatar}</div>
                        <span className="text-xs font-medium text-foreground">{r.user}</span>
                      </div>
                      <StarRating rating={r.rating} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {language === 'vi' ? r.commentVi : r.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sharing restriction notice */}
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
              <span>{t('provenanceSharing')}</span>
            </div>
          </div>
        </ScrollArea>

        {/* Sticky purchase footer — always visible */}
        <div className="flex-none border-t border-border bg-card/95 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">${plan.price.toFixed(2)}</span>
                {plan.originalPrice && <span className="text-sm text-muted-foreground line-through">${plan.originalPrice.toFixed(2)}</span>}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">One-time purchase · Unlimited use</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {owned && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={() => { onOpenInPlanner(plan); onClose() }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{language === 'vi' ? 'AI Planner' : 'Open in Planner'}</span>
                </Button>
              )}
              <Button
                size="sm"
                variant={owned ? 'secondary' : 'default'}
                className="rounded-xl px-5"
                onClick={() => { if (!owned) onBuy(plan) }}
                disabled={owned}
              >
                {owned ? <><CheckCircle className="w-3.5 h-3.5 mr-1.5" />{t('planOwned')}</> : <><ShoppingCart className="w-3.5 h-3.5 mr-1.5" />{t('buyNow')}</>}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BusinessBanner() {
  const { t } = useLanguage()
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <>
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{t('forBusinesses')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t('forBusinessesDesc')}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg text-xs flex-shrink-0 border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => setContactOpen(true)}
        >
          {t('contactSales')} <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      <Dialog open={contactOpen} onOpenChange={v => !v && setContactOpen(false)}>
        <DialogContent showCloseButton={false} className="max-w-sm p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0 -mt-1 -mr-1">
                  <X className="w-4 h-4" />
                </Button>
              </DialogClose>
            </div>
            <DialogTitle className="text-base font-bold mt-3">Business & Affiliate API</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Integrate ECSATrail itineraries into your travel platform, booking engine, or mobile app.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-2 text-xs text-muted-foreground">
              {[
                'REST API access to verified itinerary data',
                'White-label AI re-planning for your customers',
                'Bulk plan licensing for travel agencies',
                'Custom credibility thresholds & filtering',
              ].map(f => (
                <div key={f} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs">
              <p className="font-medium text-foreground mb-0.5">Contact our team</p>
              <p className="text-muted-foreground">business@ecsatrail.com</p>
            </div>
            <Button className="w-full rounded-lg" size="sm" onClick={() => setContactOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface MarketplaceProps {
  onOpenInPlanner?: (plan: TravelPlan) => void
}

export function Marketplace({ onOpenInPlanner }: MarketplaceProps) {
  const { t, language } = useLanguage()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [sort, setSort] = useState<SortKey>('featured')
  const { ownedPlanIds, purchasePlan, walletBalance, topUpWallet } = useUser()
  const [insufficientFor, setInsufficientFor] = useState<TravelPlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<TravelPlan | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [buyingPlan, setBuyingPlan] = useState<TravelPlan | null>(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)

  const CATEGORIES: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: t('filterAll') },
    { id: 'cultural', label: t('filterCultural') },
    { id: 'nature', label: t('filterNature') },
    { id: 'adventure', label: t('filterAdventure') },
    { id: 'food', label: t('filterFood') },
    { id: 'city', label: t('filterCity') },
    { id: 'beach', label: t('filterBeach') },
  ]

  const SORTS: { id: SortKey; label: string }[] = [
    { id: 'featured', label: t('sortFeatured') },
    { id: 'top-rated', label: t('sortTopRated') },
    { id: 'best-selling', label: t('sortBestSelling') },
    { id: 'newest', label: t('sortNewest') },
    { id: 'price-low', label: t('sortPriceLow') },
  ]

  const filtered = useMemo(() => {
    let plans = [...MOCK_PLANS]

    if (search) {
      const q = search.toLowerCase()
      plans = plans.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.titleVi.toLowerCase().includes(q) ||
        p.provinces.some(pv => pv.toLowerCase().includes(q)) ||
        p.creator.name.toLowerCase().includes(q) ||
        p.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }

    if (category !== 'all') {
      plans = plans.filter(p => p.category === category)
    }

    switch (sort) {
      case 'top-rated': plans.sort((a, b) => b.rating - a.rating); break
      case 'best-selling': plans.sort((a, b) => b.purchaseCount - a.purchaseCount); break
      case 'newest': plans.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break
      case 'price-low': plans.sort((a, b) => a.price - b.price); break
      default: break // featured = default order
    }

    return plans
  }, [search, category, sort])

  function handleBuy(plan: TravelPlan) {
    if (walletBalance < plan.price) {
      setInsufficientFor(plan)
      setDetailOpen(false)
      return
    }
    setBuyingPlan(plan)
    setDetailOpen(false)
    setAiModalOpen(true)
  }

  function handleAiComplete(tier: AiServiceTier | null) {
    if (buyingPlan) {
      purchasePlan(buyingPlan.id, buyingPlan.price + (tier?.price ?? 0))
    }
    setAiModalOpen(false)
    setBuyingPlan(null)
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header — flex-none */}
      <div className="flex-none border-b border-border bg-card/60 backdrop-blur-sm px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground text-balance">{t('marketplaceTitle')}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{t('marketplaceSubtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">{MOCK_PLANS.reduce((a, p) => a + p.purchaseCount, 0).toLocaleString()}</span>
                <span>plans sold this month</span>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-2 text-xs font-medium">
                <Wallet className="w-3.5 h-3.5" />
                <span>${walletBalance.toFixed(2)}</span>
                <span className="text-green-500 hidden sm:inline">credits</span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('searchPlans')}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-5 space-y-5">

          {/* Business banner */}
          <BusinessBanner />

          {/* Filter + Sort row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Category tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground mr-1" />
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    category === c.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="sm:ml-auto flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              >
                {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <span className="text-xs text-muted-foreground">
                {filtered.length} plan{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Plan grid */}
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3"
              >
                <Package className="w-10 h-10 opacity-30" />
                <p className="text-sm">No plans match your search.</p>
                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategory('all'); setSort('featured') }}>Clear filters</Button>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filtered.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    owned={ownedPlanIds.has(plan.id)}
                    onBuy={handleBuy}
                    onOpenDetail={p => { setSelectedPlan(p); setDetailOpen(true) }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Platform cut note */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-4 border-t border-border">
            <Shield className="w-3.5 h-3.5" />
            <span>{t('platformCut')} · All plans are AI fact-checked before listing</span>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <PlanDetailModal
        plan={selectedPlan}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedPlan(null) }}
        owned={selectedPlan ? ownedPlanIds.has(selectedPlan.id) : false}
        onBuy={handleBuy}
        onOpenInPlanner={(plan) => { onOpenInPlanner?.(plan); setDetailOpen(false) }}
      />

      {/* AI service modal */}
      <AiServiceModal
        open={aiModalOpen}
        plan={buyingPlan}
        onComplete={handleAiComplete}
        onClose={() => { setAiModalOpen(false); setBuyingPlan(null) }}
      />

      {/* Insufficient funds dialog */}
      <Dialog open={!!insufficientFor} onOpenChange={v => !v && setInsufficientFor(null)}>
        <DialogContent showCloseButton={false} className="max-w-sm p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-amber-600" />
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0 -mt-1 -mr-1">
                  <X className="w-4 h-4" />
                </Button>
              </DialogClose>
            </div>
            <DialogTitle className="text-base font-bold mt-3">Not enough credits</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {insufficientFor && (
                <>
                  <span className="font-medium text-foreground">{insufficientFor.title}</span> costs{' '}
                  <span className="font-semibold text-foreground">${insufficientFor.price.toFixed(2)}</span>.
                  Your balance is <span className="font-semibold text-foreground">${walletBalance.toFixed(2)}</span>.
                  Top up to continue.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 space-y-3">
            <p className="text-xs text-muted-foreground">Add credits to your wallet:</p>
            <div className="flex gap-2">
              {[10, 20, 50].map(amt => (
                <button
                  key={amt}
                  onClick={() => topUpWallet(amt)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                >
                  <Plus className="w-3 h-3" />${amt}
                </button>
              ))}
            </div>
            <Button
              className="w-full rounded-lg"
              size="sm"
              disabled={insufficientFor ? walletBalance < insufficientFor.price : true}
              onClick={() => {
                if (insufficientFor) {
                  const plan = insufficientFor
                  setInsufficientFor(null)
                  setBuyingPlan(plan)
                  setAiModalOpen(true)
                }
              }}
            >
              {insufficientFor && walletBalance >= insufficientFor.price
                ? `Buy for $${insufficientFor.price.toFixed(2)}`
                : `Need $${insufficientFor ? (insufficientFor.price - walletBalance).toFixed(2) : '0'} more`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
