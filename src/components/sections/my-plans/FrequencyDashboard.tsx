'use client'

import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts'
import { Database, ShieldCheck, TrendingUp, Globe2, Facebook, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FREQUENCY_DATA, VIETNAM_LANDMARKS } from '@/lib/mock-data'

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: string
  icon: React.ElementType
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground font-mono">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-mono font-medium text-foreground">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

const CREDIBILITY_TOOLTIP = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  const score = payload[0].value
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground mt-1">Avg credibility: <span className="font-mono font-bold text-foreground">{score}/100</span></p>
    </div>
  )
}

export function FrequencyDashboard() {
  const totalLandmarks = FREQUENCY_DATA.reduce((sum, d) => sum + d.landmarks, 0)
  const verifiedCount = VIETNAM_LANDMARKS.filter(l => l.sourceVerified).length
  const avgCredibility = Math.round(
    VIETNAM_LANDMARKS.reduce((sum, l) => sum + l.credibilityScore, 0) / VIETNAM_LANDMARKS.length
  )
  const totalSources = VIETNAM_LANDMARKS.reduce((sum, l) => sum + l.sources, 0)

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Frequency Rule Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Data Insights — how ECSATrail filters fragmented Vietnamese travel data
            </p>
          </div>
        </div>

        {/* Credibility threshold callout */}
        <div className="mt-4 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">The "Common Denominator" Rule</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Landmarks appearing across Facebook, Google Maps, <em>and</em> travel blogs with a{' '}
              <strong>60–70% overlap threshold</strong> receive a "Source Verified" badge and higher credibility scores.
              This filters out AI hallucinations and one-off reviews.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total Landmarks Indexed"
            value={totalLandmarks.toLocaleString()}
            icon={Globe2}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            label="Source Verified"
            value={`${verifiedCount}/${VIETNAM_LANDMARKS.length}`}
            icon={ShieldCheck}
            color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
          />
          <StatCard
            label="Avg Credibility Score"
            value={`${avgCredibility}/100`}
            icon={Star}
            color="bg-accent/20 text-accent-foreground"
          />
          <StatCard
            label="Total Source Hits"
            value={totalSources.toLocaleString()}
            icon={TrendingUp}
            color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
          />
        </div>

        {/* Multi-source hits chart */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-sm text-foreground mb-1">Source Distribution by Province</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Facebook hits, Google Maps hits, and blog mentions — the higher the overlap, the more credible the landmark.
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FREQUENCY_DATA} barGap={2} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="province"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Bar dataKey="facebookHits" name="Facebook" fill="#228BE6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="googleMapsHits" name="Google Maps" fill="#FAB005" radius={[3, 3, 0, 0]} />
                <Bar dataKey="blogHits" name="Blogs" fill="#40C057" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 justify-center">
            {[
              { color: '#228BE6', label: 'Facebook' },
              { color: '#FAB005', label: 'Google Maps' },
              { color: '#40C057', label: 'Blogs' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Credibility scores */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-sm text-foreground mb-1">Average Credibility Score by Province</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Provinces with consistently high scores have robust multi-source data coverage.
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FREQUENCY_DATA} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[60, 100]}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="province"
                  type="category"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CREDIBILITY_TOOLTIP />} />
                <Bar dataKey="avgCredibility" radius={[0, 6, 6, 0]}>
                  {FREQUENCY_DATA.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.avgCredibility >= 90 ? '#40C057' : entry.avgCredibility >= 85 ? '#228BE6' : '#FAB005'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Landmark table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Top Landmarks by Credibility</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Verified across multiple independent sources</p>
          </div>
          <div className="divide-y divide-border">
            {[...VIETNAM_LANDMARKS]
              .sort((a, b) => b.credibilityScore - a.credibilityScore)
              .slice(0, 7)
              .map((landmark, i) => (
                <motion.div
                  key={landmark.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center gap-4 px-5 py-3"
                >
                  <span className="text-xs font-mono text-muted-foreground w-4 flex-shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{landmark.nameEn}</p>
                    <p className="text-xs text-muted-foreground">{landmark.province}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Facebook className="w-3 h-3" />
                      <span>{landmark.sources} src</span>
                    </div>
                    {landmark.sourceVerified && (
                      <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="text-xs font-medium">Verified</span>
                      </div>
                    )}
                    <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${landmark.credibilityScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground w-8 text-right">
                      {landmark.credibilityScore}
                    </span>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
