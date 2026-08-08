'use client'
// components/public/blog/BlockRenderer.tsx
// Renders BlockNote JSON blocks as HTML without needing the full editor
import styles from './BlockRenderer.module.css'

type InlineContent = {
  type: string
  text?: string
  href?: string
  styles?: Record<string, any>
  content?: InlineContent[]
}

type Block = {
  type: string
  content?: InlineContent[]
  children?: Block[]
  props?: Record<string, any>
}

function renderStyledText(c: InlineContent, key: number | string) {
  let el: React.ReactNode = c.text ?? ''

  if (c.styles?.bold)            el = <strong>{el}</strong>
  if (c.styles?.italic)          el = <em>{el}</em>
  if (c.styles?.underline)       el = <u>{el}</u>
  if (c.styles?.strike)          el = <s>{el}</s>
  if (c.styles?.code)            el = <code>{el}</code>
  if (c.styles?.textColor)       el = <span style={{ color: c.styles.textColor }}>{el}</span>
  if (c.styles?.backgroundColor) el = <mark style={{ background: c.styles.backgroundColor }}>{el}</mark>

  return <span key={key}>{el}</span>
}

function renderInline(content: Block['content'] = []) {
  return content.map((c, i) => {
    if (c.type === 'link') {
      const href = c.href?.trim()
      if (!href) return <span key={i}>{renderInline(c.content)}</span>
      return (
        <a
          key={i}
          href={href}
          className={styles.inlineLink}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {renderInline(c.content)}
        </a>
      )
    }

    if (c.type !== 'text') return null
    return renderStyledText(c, i)
  })
}

function isButtonParagraph(block: Block) {
  const content = block.content ?? []
  if (content.length !== 1) return false
  return content[0]?.type === 'link' && Boolean(content[0]?.href?.trim())
}

function renderChildBlocks(children?: Block[]) {
  if (!children?.length) return null
  return children.map((b, i) => <Block key={i} block={b} />)
}

function Block({ block }: { block: Block }) {
  const content = renderInline(block.content)
  const hasInline = (block.content?.length ?? 0) > 0
  const childNodes = renderChildBlocks(block.children)

  switch (block.type) {
    case 'paragraph':
      if (isButtonParagraph(block)) {
        const link = block.content![0]
        const href = link.href!.trim()
        const label = (link.content || [])
          .map(node => (node.type === 'text' ? node.text ?? '' : ''))
          .join('')
          .trim() || href
        return (
          <p className={styles.buttonWrap}>
            <a
              href={href}
              className={styles.button}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {label}
            </a>
          </p>
        )
      }
      // BlockNote can nest blocks under a paragraph (e.g. indented text).
      // Don't nest <p> inside <p> — unwrap empty parents and render children.
      if (!hasInline && childNodes) return <>{childNodes}</>
      if (!hasInline && !childNodes) return null
      return (
        <>
          <p className={styles.p}>{content}</p>
          {childNodes}
        </>
      )

    case 'heading': {
      const level = block.props?.level ?? 1
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3'
      return (
        <>
          <Tag className={styles[`h${level}`]}>{content}</Tag>
          {childNodes}
        </>
      )
    }

    case 'bulletListItem':
      return <li className={styles.li}>{content}{childNodes}</li>

    case 'numberedListItem':
      return <li className={styles.li}>{content}{childNodes}</li>

    case 'checkListItem':
      return (
        <li className={styles.checkItem}>
          <span className={`${styles.check} ${block.props?.checked ? styles.checked : ''}`} />
          {content}
          {childNodes}
        </li>
      )

    case 'quote':
      return (
        <>
          <blockquote className={styles.quote}>{content}</blockquote>
          {childNodes}
        </>
      )

    case 'codeBlock':
      return (
        <pre className={styles.pre}>
          <code>{block.content?.[0]?.text}</code>
        </pre>
      )

    case 'image':
      return (
        <figure className={styles.figure}>
          <img
            src={block.props?.url}
            alt={block.props?.caption ?? ''}
            className={styles.img}
          />
          {block.props?.caption && (
            <figcaption className={styles.caption}>{block.props.caption}</figcaption>
          )}
        </figure>
      )

    case 'button': {
      const inlineLabel = block.content
        ?.map(c => {
          if (c.type === 'text') return c.text ?? ''
          if (c.type === 'link') {
            return c.content?.map(inner => inner.text ?? '').join('') ?? ''
          }
          return ''
        })
        .join('')
        .trim()
      const label = inlineLabel || block.props?.label?.trim() || 'Click here'
      const href = block.props?.url?.trim()
      if (!href) return <p className={styles.p}>{label}</p>
      return (
        <p className={styles.buttonWrap}>
          <a
            href={href}
            className={styles.button}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {label}
          </a>
        </p>
      )
    }

    case 'table':
      return (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              {block.children?.map((row, ri) => (
                <tr key={ri}>
                  {row.children?.map((cell, ci) => (
                    <td key={ci} className={styles.td}>
                      {renderInline(cell.content)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    default:
      if (!hasInline && childNodes) return <>{childNodes}</>
      return (
        <>
          {hasInline ? <p className={styles.p}>{content}</p> : null}
          {childNodes}
        </>
      )
  }
}

function groupBlocks(blocks: Block[]): React.ReactNode[] {
  const result: React.ReactNode[] = []
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]

    if (block.type === 'bulletListItem') {
      const list: Block[] = []
      while (i < blocks.length && blocks[i].type === 'bulletListItem') {
        list.push(blocks[i++])
      }
      result.push(
        <ul key={i} className={styles.ul}>
          {list.map((b, j) => <Block key={j} block={b} />)}
        </ul>
      )
      continue
    }

    if (block.type === 'numberedListItem') {
      const list: Block[] = []
      while (i < blocks.length && blocks[i].type === 'numberedListItem') {
        list.push(blocks[i++])
      }
      result.push(
        <ol key={i} className={styles.ol}>
          {list.map((b, j) => <Block key={j} block={b} />)}
        </ol>
      )
      continue
    }

    result.push(<Block key={i} block={block} />)
    i++
  }

  return result
}

export default function BlockRenderer({ content }: { content: any }) {
  if (!content || !Array.isArray(content)) {
    return <p>No content.</p>
  }

  return (
    <div className={styles.renderer}>
      {groupBlocks(content)}
    </div>
  )
}
