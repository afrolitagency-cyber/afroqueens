import AnalyticsDashboard from './AnalyticsDashboard'

export default function AnalyticsPage() {
  const gaConnected = Boolean(process.env.NEXT_PUBLIC_GA_ID)

  return <AnalyticsDashboard gaConnected={gaConnected} />
}
