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
