// app/(admin)/admin/settings/page.tsx
import { redirect } from 'next/navigation'
export default function SettingsIndex() {
  redirect('/admin/settings/general')
}
