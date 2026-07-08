// components/admin/uploads/deleteRemoteMedia.ts
/** Remove a file from Cloudinary or Supabase (admin-only API). */
export async function deleteRemoteMedia(url: string): Promise<void> {
  if (!url?.trim()) return

  const res = await fetch('/api/media/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Failed to delete file from storage')
  }
}
