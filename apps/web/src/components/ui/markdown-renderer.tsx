'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Zero-dependency Markdown renderer — no ESM packages.
 *
 * Supports the subset used by AI-generated coding problem statements:
 *   ### headings, **bold**, `inline code`, \n\n paragraphs,
 *   - unordered lists, 1. ordered lists, --- horizontal rules,
 *   > blockquotes, ```code blocks```
 */

// ---------------------------------------------------------------------------
// Tokeniser
// ---------------------------------------------------------------------------
type Token =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'hr' }
  | { type: 'codeblock'; lang: string; code: string }
  | { type: 'blockquote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'p'; text: string }
  | { type: 'blank' };

function tokenise(markdown: string): Token[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const tokens: Token[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimEnd().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: 'codeblock', lang, code: codeLines.join('\n') });
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      tokens.push({ type: 'h3', text: line.slice(4) });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      tokens.push({ type: 'h2', text: line.slice(3) });
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      tokens.push({ type: 'h1', text: line.slice(2) });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      tokens.push({ type: 'hr' });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      tokens.push({ type: 'blockquote', text: line.slice(2) });
      i++;
      continue;
    }

    // Unordered list (collect consecutive items)
    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i].trimEnd())) {
        items.push(lines[i].replace(/^[-*+] /, '').trimEnd());
        i++;
      }
      tokens.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trimEnd())) {
        items.push(lines[i].replace(/^\d+\. /, '').trimEnd());
        i++;
      }
      tokens.push({ type: 'ol', items });
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      tokens.push({ type: 'blank' });
      i++;
      continue;
    }

    // Paragraph — collect until blank or structural token
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,3} |```|---|\*\*\*|> |[-*+] |\d+\. )/.test(lines[i])
    ) {
      paragraphLines.push(lines[i].trimEnd());
      i++;
    }
    if (paragraphLines.length) {
      tokens.push({ type: 'p', text: paragraphLines.join(' ') });
    }
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Inline formatter  — bold, italic, inline code
// ---------------------------------------------------------------------------
function renderInline(text: string): React.ReactNode[] {
  // Split on **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="bg-slate-100 text-rose-600 text-[13px] font-mono px-1.5 py-0.5 rounded"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const tokens = tokenise(content || '');

  const nodes = tokens.map((token, idx) => {
    switch (token.type) {
      case 'h1':
        return (
          <h1
            key={idx}
            className="text-xl font-bold text-slate-900 mt-0 mb-3 pb-2 border-b border-slate-200"
          >
            {renderInline(token.text)}
          </h1>
        );
      case 'h2':
        return (
          <h2 key={idx} className="text-base font-bold text-slate-800 mt-5 mb-2">
            {renderInline(token.text)}
          </h2>
        );
      case 'h3':
        return (
          <h3
            key={idx}
            className="text-[11px] font-bold text-slate-500 mt-4 mb-1.5 uppercase tracking-widest"
          >
            {renderInline(token.text)}
          </h3>
        );
      case 'p':
        return (
          <p key={idx} className="text-[15px] leading-relaxed text-slate-800 mb-2 last:mb-0">
            {renderInline(token.text)}
          </p>
        );
      case 'ul':
        return (
          <ul key={idx} className="list-disc list-inside space-y-0.5 mb-2 text-[15px] text-slate-800 pl-2">
            {token.items.map((item, j) => (
              <li key={j} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol key={idx} className="list-decimal list-inside space-y-0.5 mb-2 text-[15px] text-slate-800 pl-2">
            {token.items.map((item, j) => (
              <li key={j} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      case 'codeblock':
        return (
          <pre
            key={idx}
            className="bg-slate-900 text-emerald-300 text-xs font-mono p-3 rounded-md overflow-x-auto mb-3 mt-1 whitespace-pre"
          >
            {token.code}
          </pre>
        );
      case 'blockquote':
        return (
          <blockquote
            key={idx}
            className="border-l-4 border-primary/40 pl-4 py-1 my-2 bg-primary/5 rounded-r-md text-slate-700 text-sm italic"
          >
            {renderInline(token.text)}
          </blockquote>
        );
      case 'hr':
        return <hr key={idx} className="my-3 border-slate-200" />;
      case 'blank':
        return null;
      default:
        return null;
    }
  });

  return (
    <div className={`space-y-0 ${className}`}>
      {nodes}
    </div>
  );
}
