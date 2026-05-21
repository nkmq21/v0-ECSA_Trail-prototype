import { AppShell } from '@/components/layouts/AppShell'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
