'use client'
// components/admin/editors/BlockEditor.tsx
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import styles from './BlockEditor.module.css'

interface Props {
  initialContent?: any
  onChange: (content: any) => void
}

export default function BlockEditor({ initialContent, onChange }: Props) {
  const editor = useCreateBlockNote({
    initialContent: initialContent ?? undefined,

    // Wire image upload to Cloudinary via our API route
    uploadFile: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'blog')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      return url // BlockNote stores this as the image src
    },
  })

  return (
    <div className={styles.wrap}>
      <BlockNoteView
        editor={editor}
        onChange={() => onChange(editor.document)}
        theme="light"
      />
    </div>
  )
}
