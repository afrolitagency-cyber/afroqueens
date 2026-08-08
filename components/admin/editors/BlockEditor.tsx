'use client'
// components/admin/editors/BlockEditor.tsx
import {
  filterSuggestionItems,
  insertOrUpdateBlock,
  filenameFromURL,
} from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import {
  EmbedTab,
  FilePanelController,
  SuggestionMenuController,
  UploadTab,
  getDefaultReactSlashMenuItems,
  useBlockNoteEditor,
  useComponentsContext,
  useCreateBlockNote,
  type FilePanelProps,
} from '@blocknote/react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import '@blocknote/mantine/style.css'
import MediaLibraryPicker from '@/components/admin/uploads/MediaLibraryPicker'
import styles from './BlockEditor.module.css'

interface Props {
  initialContent?: any
  onChange: (content: any) => void
}

type LibraryRequest = {
  block: FilePanelProps['block']
}

const LibraryPickerContext = createContext<{
  openLibrary: (block: FilePanelProps['block']) => void
} | null>(null)

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
    const url = typeof block?.props?.url === 'string' ? block.props.url.trim() : ''

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

function LibraryTab(props: FilePanelProps) {
  const Components = useComponentsContext()!
  const editor = useBlockNoteEditor()
  const library = useContext(LibraryPickerContext)

  return (
    <Components.FilePanel.TabPanel className="bn-tab-panel">
      <p className={styles.libraryHint}>
        Reuse an image already in Media Library instead of uploading again.
      </p>
      <Components.FilePanel.Button
        className="bn-button"
        onClick={() => {
          library?.openLibrary(props.block)
          editor.filePanel?.closeMenu()
        }}
      >
        Choose from library
      </Components.FilePanel.Button>
    </Components.FilePanel.TabPanel>
  )
}

function MediaAwareFilePanel(props: FilePanelProps) {
  const Components = useComponentsContext()!
  const editor = useBlockNoteEditor()
  const [loading, setLoading] = useState(false)
  const [openTab, setOpenTab] = useState('Library')

  const tabs = useMemo(
    () => [
      ...(editor.uploadFile !== undefined
        ? [
            {
              name: 'Upload',
              tabPanel: <UploadTab block={props.block} setLoading={setLoading} />,
            },
          ]
        : []),
      {
        name: 'Library',
        tabPanel: <LibraryTab block={props.block} />,
      },
      {
        name: 'Embed',
        tabPanel: <EmbedTab block={props.block} />,
      },
    ],
    [editor.uploadFile, props.block],
  )

  return (
    <Components.FilePanel.Root
      className="bn-panel"
      defaultOpenTab={openTab}
      openTab={openTab}
      setOpenTab={setOpenTab}
      tabs={tabs}
      loading={loading}
    />
  )
}

export default function BlockEditor({ initialContent, onChange }: Props) {
  const [libraryRequest, setLibraryRequest] = useState<LibraryRequest | null>(null)

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

  const openLibrary = useCallback((block: FilePanelProps['block']) => {
    setLibraryRequest({ block })
  }, [])

  const libraryCtx = useMemo(() => ({ openLibrary }), [openLibrary])

  return (
    <LibraryPickerContext.Provider value={libraryCtx}>
      <div className={styles.wrap}>
        <BlockNoteView
          editor={editor}
          onChange={() => onChange(editor.document)}
          theme="light"
          slashMenu={false}
          filePanel={false}
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
          <FilePanelController filePanel={MediaAwareFilePanel} />
        </BlockNoteView>
      </div>

      <MediaLibraryPicker
        open={!!libraryRequest}
        folder="blog"
        onClose={() => setLibraryRequest(null)}
        onSelect={url => {
          if (!libraryRequest) return
          editor.updateBlock(libraryRequest.block, {
            props: {
              name: filenameFromURL(url),
              url,
            } as any,
          })
          setLibraryRequest(null)
        }}
      />
    </LibraryPickerContext.Provider>
  )
}
