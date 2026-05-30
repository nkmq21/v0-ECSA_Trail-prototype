import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/nprogress/styles.css'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { ColorSchemeScript } from '@mantine/core'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'ECSATrail — AI Travel Planner Vietnam',
    description:
        'AI-driven, end-to-end travel planning for Vietnam. Interactive map-first UX, real-time itinerary generation, and autonomous re-planning powered by Gemini.',
    generator: 'v0.app',
    manifest: '/manifest.json',
    keywords: ['Vietnam travel', 'AI planner', 'itinerary', 'ECSATrail'],
    authors: [{ name: 'ECSATrail' }],
    openGraph: {
        title: 'ECSATrail — AI Travel Planner Vietnam',
        description: 'Plan your perfect Vietnam trip with AI.',
        type: 'website',
    },
}

export const viewport: Viewport = {
    themeColor: '#228BE6',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
            <head>
                <ColorSchemeScript />
                <link rel="apple-touch-icon" href="/icon-192.png" />
            </head>
            <body className="font-sans antialiased">
                <ThemeProvider>{children}</ThemeProvider>
                <Analytics />
            </body>
        </html>
    )
}
