import React from 'react';

export default function MessageContent({ content, role }) {
  if (!content) return null;
  
  // Nettoyer le contenu
  const cleanText = String(content)
    .replace(/"""/g, '"')
    .replace(/""/g, '"')
    .replace(/\*\*/g, '')
    .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
  
  // Affichage simple
  return (
    <div className="space-y-3">
      {cleanText.split('\n\n').filter(p => p.trim()).map((para, i) => (
        <p key={i} className="text-gray-800 leading-relaxed">
          {para}
        </p>
      ))}
    </div>
  );
}
