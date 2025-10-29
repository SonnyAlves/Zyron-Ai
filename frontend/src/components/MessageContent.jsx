import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MessageContent({ content, role }) {
  // DEBUG: Log what we receive
  console.log('🔍 MessageContent received:', {
    role,
    contentType: typeof content,
    contentLength: content?.length,
    first100chars: content?.substring(0, 100),
    hasLiteralBackslashN: content?.includes('\\n'),
    hasRealNewline: content?.includes('\n')
  })

  // The content should already be properly decoded by JSON.parse() in the hook
  // But just in case, we'll use the content as-is since JSON handles all escaping
  const processedContent = content

  console.log('✅ Content received, length:', content?.length, 'first 100:', content?.substring(0, 100))

  // For user messages, just show plain text
  if (role === 'user') {
    return <div style={{ whiteSpace: 'pre-wrap' }}>{processedContent}</div>
  }

  // For AI messages, render markdown with proper styling
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Style headings
        h1: ({ children }) => (
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '16px',
            marginTop: '16px',
            color: '#1F2937'
          }}>
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '12px',
            marginTop: '12px',
            color: '#1F2937'
          }}>
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '8px',
            marginTop: '8px',
            color: '#374151'
          }}>
            {children}
          </h3>
        ),

        // Style lists with proper bullets
        ul: ({ children }) => (
          <ul style={{
            listStyleType: 'disc',
            marginLeft: '24px',
            marginBottom: '12px',
            marginTop: '8px'
          }}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol style={{
            listStyleType: 'decimal',
            marginLeft: '24px',
            marginBottom: '12px',
            marginTop: '8px'
          }}>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li style={{
            marginBottom: '4px',
            lineHeight: '1.6'
          }}>
            {children}
          </li>
        ),

        // Style emphasis
        strong: ({ children }) => (
          <strong style={{
            fontWeight: 'bold',
            color: '#1F2937'
          }}>
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em style={{ fontStyle: 'italic' }}>{children}</em>
        ),

        // Style code blocks
        code: ({ inline, children }) => {
          if (inline) {
            return (
              <code style={{
                background: '#F3F4F6',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#DC2626'
              }}>
                {children}
              </code>
            )
          }

          return (
            <pre style={{
              background: '#1F2937',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              marginBottom: '12px',
              marginTop: '8px'
            }}>
              <code style={{
                color: '#F9FAFB',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}>
                {children}
              </code>
            </pre>
          )
        },

        // Style paragraphs
        p: ({ children }) => (
          <p style={{
            marginBottom: '12px',
            lineHeight: '1.6',
            color: '#374151'
          }}>
            {children}
          </p>
        ),

        // Style blockquotes
        blockquote: ({ children }) => (
          <blockquote style={{
            borderLeft: '4px solid #3B82F6',
            paddingLeft: '16px',
            marginLeft: '0',
            marginBottom: '12px',
            color: '#6B7280',
            fontStyle: 'italic'
          }}>
            {children}
          </blockquote>
        ),

        // Style links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#3B82F6',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            {children}
          </a>
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  )
}
