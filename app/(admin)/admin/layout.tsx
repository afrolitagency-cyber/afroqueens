// app/(admin)/admin/layout.tsx — passthrough; auth lives in (protected)/layout.tsx
export const metadata = { title: 'Afroqueens Admin' }

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
