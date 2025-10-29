import React from 'react';

export default function MessageRenderer({ content, role }) {
  // FORCE DECODE - This will work regardless of encoding
  let decoded = content || '';

  // Fix literal \n
  decoded = decoded.replace(/\\n/g, '\n');

  // Fix literal \"
  decoded = decoded.replace(/\\"/g, '"');

  // Fix unicode like \u00e9
  decoded = decoded.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
    return String.fromCharCode(parseInt(grp, 16));
  });

  // Fix literal \\
  decoded = decoded.replace(/\\\\/g, '\\');

  // User messages - simple display
  if (role === 'user') {
    return (
      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
        {decoded}
      </div>
    );
  }

  // AI messages - format as structured text
  // Split into paragraphs
  const paragraphs = decoded.split('\n\n').filter(p => p.trim());

  return (
    <div className="space-y-4">
      {paragraphs.map((para, idx) => {
        const trimmed = para.trim();

        // Detect headings (### Title or **Title**)
        if (trimmed.startsWith('###')) {
          const text = trimmed.replace(/^###\s*/, '');
          return (
            <h3 key={idx} className="text-lg font-bold text-gray-900 mt-4 first:mt-0">
              {text}
            </h3>
          );
        }

        if (trimmed.startsWith('##')) {
          const text = trimmed.replace(/^##\s*/, '');
          return (
            <h2 key={idx} className="text-xl font-bold text-gray-900 mt-5 first:mt-0">
              {text}
            </h2>
          );
        }

        // Detect lists (- item or 1. item)
        if (trimmed.includes('\n-') || trimmed.includes('\n•')) {
          const items = trimmed.split('\n').filter(l => l.trim());
          return (
            <ul key={idx} className="list-disc list-outside ml-6 space-y-2">
              {items.map((item, i) => {
                const cleaned = item.replace(/^[-•]\s*/, '').trim();
                if (!cleaned) return null;
                return (
                  <li key={i} className="text-gray-800 leading-7">
                    {formatInline(cleaned)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="text-gray-800 leading-7">
            {formatInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Format inline markdown (bold, italic, code)
function formatInline(text) {
  const parts = [];
  let current = '';
  let i = 0;

  while (i < text.length) {
    // Bold: **text**
    if (text.substr(i, 2) === '**') {
      if (current) {
        parts.push(<span key={parts.length}>{current}</span>);
        current = '';
      }
      const endIdx = text.indexOf('**', i + 2);
      if (endIdx > -1) {
        const boldText = text.substring(i + 2, endIdx);
        parts.push(
          <strong key={parts.length} className="font-semibold text-gray-900">
            {boldText}
          </strong>
        );
        i = endIdx + 2;
        continue;
      }
    }

    // Code: `code`
    if (text[i] === '`') {
      if (current) {
        parts.push(<span key={parts.length}>{current}</span>);
        current = '';
      }
      const endIdx = text.indexOf('`', i + 1);
      if (endIdx > -1) {
        const codeText = text.substring(i + 1, endIdx);
        parts.push(
          <code key={parts.length} className="px-1.5 py-0.5 bg-gray-100 text-gray-900 rounded text-sm font-mono">
            {codeText}
          </code>
        );
        i = endIdx + 1;
        continue;
      }
    }

    current += text[i];
    i++;
  }

  if (current) {
    parts.push(<span key={parts.length}>{current}</span>);
  }

  return parts.length > 0 ? parts : text;
}
