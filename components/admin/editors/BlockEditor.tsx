'use client'
// components/admin/editors/BlockEditor.tsx
import {
  filterSuggestionItems,
  insertOrUpdateBlock,
} from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import {
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  useCreateBlockNote,
} from '@blocknote/react'
import '@blocknote/mantine/style.css'
import styles from './BlockEditor.module.css'

interface Props {
  initialContent?: any
  onChange: (content: any) => void
}

function inlineText(text: string) {
  return [{ type: 'text' as const, text, styles: {} }]
}

function readButtonLabel(block: any) {
  if (typeof block?.props?.label === 'string' && block.props.label.trim()) {
    return block.props.label.trim()
  }
  if (!Array.isArray(block?.content)) return 'Click here'
  const text = block.content
    .map((node: any) => {
      if (node?.type === 'text') return node.text ?? ''
      if (node?.type === 'link') {
        return (node.content || []).map((inner: any) => inner.text ?? '').join('')
      }
      return ''
    })
    .join('')
    .trim()
  return text || 'Click here'
}

/** Convert older custom button blocks into normal link paragraphs BlockNote can load. */
function sanitizeContent(content: any): any[] | undefined {
  if (!Array.isArray(content) || content.length === 0) return undefined

  return content.map((block: any) => {
    if (!block || block.type !== 'button') return block

    const label = readButtonLabel(block)
    const url = typeof block.props?.url === 'string' ? block.props.url.trim() : ''

    if (!url) {
      return {
        id: block.id,
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: inlineText(label),
        children: [],
      }
    }

    return {
      id: block.id,
      type: 'paragraph',
      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [
        {
          type: 'link',
          href: url,
          content: inlineText(label),
        },
      ],
      children: [],
    }
  })
}

export default function BlockEditor({ initialContent, onChange }: Props) {
  const editor = useCreateBlockNote({
    initialContent: sanitizeContent(initialContent),

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
      return url
    },
  })

  return (
    <div className={styles.wrap}>
      <BlockNoteView
        editor={editor}
        onChange={() => onChange(editor.document)}
        theme="light"
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async query =>
            filterSuggestionItems(
              [
                ...getDefaultReactSlashMenuItems(editor),
                {
                  title: 'Button',
                  subtext: 'Insert a button link (edit URL via the link toolbar)',
                  aliases: ['button', 'cta', 'link button', 'call to action'],
                  group: 'Media',
                  icon: <span className={styles.menuIcon}>⬚</span>,
                  onItemClick: () => {
                    insertOrUpdateBlock(editor, {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'link',
                          href: 'https://',
                          content: 'Click here',
                        },
                      ],
                    } as any)
                  },
                },
              ],
              query,
            )
          }
        />
      </BlockNoteView>
    </div>
  )
}
