'use client'
// components/public/blog/BlockRenderer.tsx
// Renders BlockNote JSON blocks as HTML without needing the full editor
import styles from './BlockRenderer.module.css'

type Block = {
  type: string
  content?: Array<{ type: string; text?: string; styles?: Record<string, any> }>
  children?: Block[]
  props?: Record<string, any>
}

function renderInline(content: Block['content'] = []) {
  return content.map((c, i) => {
    if (c.type !== 'text') return null
    let el: React.ReactNode = c.text

    if (c.styles?.bold)          el = <strong key={i}>{el}</strong>
    if (c.styles?.italic)        el = <em key={i}>{el}</em>
    if (c.styles?.underline)     el = <u key={i}>{el}</u>
    if (c.styles?.strike)        el = <s key={i}>{el}</s>
    if (c.styles?.code)          el = <code key={i}>{el}</code>
    if (c.styles?.textColor)     el = <span key={i} style={{ color: c.styles.textColor }}>{el}</span>
    if (c.styles?.backgroundColor) el = <mark key={i} style={{ background: c.styles.backgroundColor }}>{el}</mark>

    return <span key={i}>{el}</span>
  })
}

function Block({ block }: { block: Block }) {
  const content = renderInline(block.content)
  const children = block.children?.map((b, i) => <Block key={i} block={b} />)

  switch (block.type) {
    case 'paragraph':
      return <p className={styles.p}>{content}</p>

    case 'heading':
      const level = block.props?.level ?? 1
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3'
      return <Tag className={styles[`h${level}`]}>{content}</Tag>

    case 'bulletListItem':
      return <li className={styles.li}>{content}{children}</li>

    case 'numberedListItem':
      return <li className={styles.li}>{content}{children}</li>

    case 'checkListItem':
      return (
        <li className={styles.checkItem}>
          <span className={`${styles.check} ${block.props?.checked ? styles.checked : ''}`} />
          {content}
        </li>
      )

    case 'quote':
      return <blockquote className={styles.quote}>{content}</blockquote>

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
      return <p className={styles.p}>{content}</p>
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
