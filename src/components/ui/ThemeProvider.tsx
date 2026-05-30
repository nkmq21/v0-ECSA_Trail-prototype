'use client'

import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { theme } from '@/lib/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <MantineProvider theme={theme}>
            <Notifications />
            {children}
        </MantineProvider>
    )
}
