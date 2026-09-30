import { refHref } from '@duatf/feature-framework-library-api'
import { Prose } from '@duatf/core-ui'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MarkdownProps = {
  source: string
  voice?: 'law' | 'guide'
  /** Drop the note's own "# Title" when the page header already shows it. */
  dropTitle?: boolean
}

const withoutTitle = (source: string) => source.replace(/^\s*#\s+.+\n+/, '')

export const Markdown = ({ source, voice = 'guide', dropTitle = true }: MarkdownProps) => (
  <Prose voice={voice}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={(url) => url}
      components={{
        a: ({ href, children }) => {
          const target = refHref(href ?? '')
          return target.startsWith('/') ? (
            <Link href={target}>{children}</Link>
          ) : (
            <a href={target} rel="noreferrer">
              {children}
            </a>
          )
        },
      }}
    >
      {dropTitle ? withoutTitle(source) : source}
    </ReactMarkdown>
  </Prose>
)
