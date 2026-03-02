// ECSATrail – shared types

export interface Landmark {
  id: string
  name: string
  nameEn: string
  province: string
  lat: number
  lng: number
  category: 'temple' | 'nature' | 'beach' | 'museum' | 'food' | 'market' | 'cave'
  credibilityScore: number // 0-100
  sources: number // number of data sources
  sourceVerified: boolean // appears in 3+ sources
  description: string
  imageUrl: string
  duration: number // suggested hours
  indoor: boolean
}

export interface ItineraryStop {
  landmark: Landmark
  order: number
  travelTime: number // minutes from previous
  transportMode: 'walk' | 'taxi' | 'motorbike' | 'bus'
  notes: string
}

export interface Itinerary {
  id: string
  title: string
  days: number
  stops: ItineraryStop[]
  generatedAt: string
  totalDuration: number // hours
  weatherAlert?: WeatherAlert
}

export interface WeatherAlert {
  type: 'rain' | 'storm' | 'clear'
  severity: 'low' | 'medium' | 'high'
  message: string
  affectedStops: string[] // landmark ids
  planBGenerated: boolean
}

export interface FrequencyDataPoint {
  province: string
  landmarks: number
  avgCredibility: number
  facebookHits: number
  googleMapsHits: number
  blogHits: number
}

// ─── Business Model Types ──────────────────────────────────────────────────

export type AiTier = 'per-plan' | 'monthly'

export interface Creator {
  id: string
  name: string
  avatar: string
  bio: string
  province: string
  totalPlans: number
  totalSales: number
  rating: number
  verified: boolean
  joinedYear: number
  platformCut: number // percentage ECSATrail takes (e.g. 15)
}

export interface TravelPlan {
  id: string
  title: string
  titleVi: string
  creator: Creator
  price: number // USD
  originalPrice?: number // for sale display
  rating: number
  reviewCount: number
  purchaseCount: number
  province: string
  provinces: string[]
  duration: number // days
  difficulty: 'easy' | 'moderate' | 'challenging'
  category: 'cultural' | 'nature' | 'food' | 'adventure' | 'beach' | 'city'
  coverImage: string
  highlights: string[]
  highlightsVi: string[]
  stops: ItineraryStop[]
  aiVerified: boolean
  factChecked: boolean
  includesTransport: boolean
  includesTips: boolean
  includesMedia: boolean
  createdAt: string
  updatedAt: string
  tags: string[]
  shared: boolean // whether creator has premium sharing
}

export interface PurchasedPlan extends TravelPlan {
  purchasedAt: string
  aiTier: AiTier | null
  customizedStops: ItineraryStop[]
  activePlan: 'a' | 'b'
  notes: string
}

export interface AiServiceTier {
  id: AiTier
  label: string
  labelVi: string
  price: number
  priceLabel: string
  memory: string
  memoryVi: string
  context: string
  contextVi: string
  features: string[]
  featuresVi: string[]
  recommended?: boolean
}

export interface Review {
  id: string
  user: string
  avatar: string
  rating: number
  comment: string
  commentVi: string
  date: string
  helpful: number
}
