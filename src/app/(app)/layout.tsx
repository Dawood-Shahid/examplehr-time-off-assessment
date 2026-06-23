import { AdminShell } from '@/components/layout/AdminShell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
