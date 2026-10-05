// lib/uploadValidation.ts — server-side checks for user-supplied files.
// The browser-reported MIME type is spoofable, so audio is also checked by its leading bytes.

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_AUDIO_BYTES = 50 * 1024 * 1024

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

export function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.has(file.type)) return 'Image must be JPG, PNG, WebP, GIF or AVIF.'
  if (file.size > MAX_IMAGE_BYTES) return 'Image too large (max 10MB).'
  if (file.size === 0) return 'File is empty.'
  return null
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((b, i) => bytes[offset + i] === b)
}

function looksLikeAudio(bytes: Uint8Array): boolean {
  if (startsWith(bytes, [0x49, 0x44, 0x33])) return true // MP3 with ID3 tag
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return true // MP3/AAC frame sync
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x41, 0x56, 0x45], 8)) return true // WAV
  if (startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4)) return true // M4A / MP4 audio
  if (startsWith(bytes, [0x4f, 0x67, 0x67, 0x53])) return true // OGG
  if (startsWith(bytes, [0x66, 0x4c, 0x61, 0x43])) return true // FLAC
  return false
}

export function validateAudioFile(file: File, buffer: Buffer): string | null {
  if (!file.type.startsWith('audio/')) return 'File must be audio.'
  if (file.size > MAX_AUDIO_BYTES) return 'File too large (max 50MB).'
  if (file.size === 0) return 'File is empty.'
  if (!looksLikeAudio(new Uint8Array(buffer.subarray(0, 16)))) {
    return 'File does not look like MP3, WAV, M4A, OGG or FLAC audio.'
  }
  return null
}
