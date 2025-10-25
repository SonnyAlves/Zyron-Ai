import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownMessage.css';

const MarkdownMessage = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Code blocks avec syntax highlighting
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';

          return !inline && language ? (
            <div className="code-block-wrapper">
              <div className="code-block-header">
                <span className="code-language">{language}</span>
                <button
                  className="copy-code-button"
                  onClick={() => {
                    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                  }}
                >
                  Copy
                </button>
              </div>
              <pre className="code-block-pre">
                <code className="code-block-code" {...props}>
                  {String(children).replace(/\n$/, '')}
                </code>
              </pre>
            </div>
          ) : (
            <code className="inline-code" {...props}>
              {children}
            </code>
          );
        },

        // Liens cliquables
        a({ node, children, href, ...props }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="markdown-link"
              {...props}
            >
              {children}
            </a>
          );
        },

        // Paragraphes
        p({ node, children, ...props }) {
          return <p className="markdown-paragraph" {...props}>{children}</p>;
        },

        // Headers
        h1({ node, children, ...props }) {
          return <h1 className="markdown-h1" {...props}>{children}</h1>;
        },
        h2({ node, children, ...props }) {
          return <h2 className="markdown-h2" {...props}>{children}</h2>;
        },
        h3({ node, children, ...props }) {
          return <h3 className="markdown-h3" {...props}>{children}</h3>;
        },

        // Listes
        ul({ node, children, ...props }) {
          return <ul className="markdown-list" {...props}>{children}</ul>;
        },
        ol({ node, children, ...props }) {
          return <ol className="markdown-list numbered" {...props}>{children}</ol>;
        },

        // Blockquotes
        blockquote({ node, children, ...props }) {
          return <blockquote className="markdown-blockquote" {...props}>{children}</blockquote>;
        },

        // Tables
        table({ node, children, ...props }) {
          return <table className="markdown-table" {...props}>{children}</table>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownMessage;
