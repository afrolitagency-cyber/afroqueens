// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side only
)

export async function uploadAudio(
  file: Buffer,
  fileName: string,
  folder: 'episodes' | 'artists'
): Promise<string> {
  const path = `${folder}/${Date.now()}-${fileName}`

  const { error } = await supabase.storage
    .from('afroqueens-audio')
    .upload(path, file, {
      contentType: 'audio/mpeg',
      upsert: false,
    })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage
    .from('afroqueens-audio')
    .getPublicUrl(path)

  return data.publicUrl
}

const AUDIO_BUCKET = 'afroqueens-audio'

/** Storage object path from a Supabase public URL, e.g. episodes/123-track.mp3 */
export function supabaseStoragePathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    const marker = `/storage/v1/object/public/${AUDIO_BUCKET}/`
    const idx = url.pathname.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(url.pathname.slice(idx + marker.length))
  } catch {
    return null
  }
}

export async function deleteStorageFile(path: string) {
  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .remove([path])
  if (error) throw new Error(error.message)
}

/** @deprecated Use deleteStorageFile — kept for compatibility */
export async function deleteAudio(path: string) {
  return deleteStorageFile(path)
}
