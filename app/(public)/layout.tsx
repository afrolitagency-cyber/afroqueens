// app/(public)/layout.tsx
import Ticker from '@/components/public/nav/Ticker'
import Navbar from '@/components/public/nav/Navbar'
import Footer from '@/components/public/Footer'

export const revalidate = 60

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Ticker />
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
