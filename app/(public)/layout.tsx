// app/(public)/layout.tsx
import Navbar from '@/components/public/nav/Navbar'
import Footer from '@/components/public/Footer'
import HomeTicker from '@/components/public/nav/HomeTicker'
import PublicSiteWidgets from '@/components/public/widgets/PublicSiteWidgets'

export const revalidate = 60

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <PublicSiteWidgets />
      <HomeTicker />
      <Footer />
    </>
  )
}
