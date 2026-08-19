'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Zero-dependency Markdown renderer tailored for coding exam problem statements.
 *
 * Supports:
 *   - Headings: # (h1) through ###### (h6)
 *   - Automatic Example detection & structured Example Card styling
 *   - Input / Output / Explanation formatting with code containers
 *   - Inline formatting: **bold**, __bold__, *italic*, _italic_, `inline code`
 *   - Fenced code blocks (```lang ... ```)
 *   - Lists (-, *, +, 1., 2.)
 *   - Tables (| header | header |)
 *   - Blockquotes (> ...)
 *   - Dark mode support
 */

// ---------------------------------------------------------------------------
// Tokeniser
// ---------------------------------------------------------------------------
type Token =
  | { type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; text: string }
  | { type: 'hr' }
  | { type: 'codeblock'; lang: string; code: string }
  | { type: 'blockquote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'p'; lines: string[] }
  | { type: 'blank' };

function normalizeMarkdown(rawMarkdown: string): string {
  let text = rawMarkdown.replace(/\r\n/g, '\n');

  // Fix squished "Example 1 Input:" or "**Example 1 Input:**" -> "#### Example 1\n**Input:**"
  text = text.replace(
    /(?:#{1,6}\s*)?(?:\*\*)?Example\s*(\d+)(?:\*\*)?\s*(?:Input:|\*\*Input:\*\*)/gi,
    '#### Example $1\n**Input:**',
  );

  // Fix standalone "**Example 1**" or "Example 1:" on its own line -> "#### Example 1"
  text = text.replace(
    /^(?:(?:\*\*|\b)Example\s*(\d+):?(?:\*\*|\b))\s*$/gim,
    '#### Example $1',
  );

  // Ensure "Input:", "Output:", "Explanation:" on single lines are separated nicely
  text = text.replace(
    /([^\n])\s*(\*\*(?:Input|Output|Explanation):\*\*|(?:Input|Output|Explanation):)/gi,
    '$1\n$2',
  );

  return text;
}

function tokenise(markdown: string): Token[] {
  const normalized = normalizeMarkdown(markdown);
  const lines = normalized.split('\n');
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

    // Headings (check h6 down to h1)
    if (line.startsWith('###### ')) {
      tokens.push({ type: 'h6', text: line.slice(7).trim() });
      i++;
      continue;
    }
    if (line.startsWith('##### ')) {
      tokens.push({ type: 'h5', text: line.slice(6).trim() });
      i++;
      continue;
    }
    if (line.startsWith('#### ')) {
      tokens.push({ type: 'h4', text: line.slice(5).trim() });
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      tokens.push({ type: 'h3', text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      tokens.push({ type: 'h2', text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      tokens.push({ type: 'h1', text: line.slice(2).trim() });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      tokens.push({ type: 'hr' });
      i++;
      continue;
    }

    // Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const parseRow = (str: string) =>
        str
          .trim()
          .slice(1, -1)
          .split('|')
          .map((cell) => cell.trim());

      const headers = parseRow(line);
      i++;

      // Skip delimiter row if present (e.g., |---|---|)
      if (i < lines.length && /^\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)*\|?$/.test(lines[i].trim())) {
        i++;
      }

      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseRow(lines[i]));
        i++;
      }

      tokens.push({ type: 'table', headers, rows });
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      tokens.push({ type: 'blockquote', text: line.slice(2) });
      i++;
      continue;
    }

    // Unordered list
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

    // Paragraph — collect until blank or another structural token
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6} |```|---|\*\*\*|> |[-*+] |\d+\. |\|)/.test(lines[i])
    ) {
      paragraphLines.push(lines[i].trimEnd());
      i++;
    }
    if (paragraphLines.length) {
      tokens.push({ type: 'p', lines: paragraphLines });
    }
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Inline formatter — bold, italic, code pills, JSON / formulas
// ---------------------------------------------------------------------------
function renderInline(text: string): React.ReactNode[] {
  // Regex to match **bold**, __bold__, *italic*, _italic_, `inline code`
  const parts = text.split(
    /(\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+\*(?!\*)|(?<!_)_[^_]+_(?!_)|`[^`]+`)/g,
  );

  return parts.map((part, idx) => {
    if (!part) return null;

    if (
      (part.startsWith('**') && part.endsWith('**')) ||
      (part.startsWith('__') && part.endsWith('__'))
    ) {
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (
      (part.startsWith('*') && part.endsWith('*')) ||
      (part.startsWith('_') && part.endsWith('_'))
    ) {
      return (
        <em key={idx} className="italic text-slate-700 dark:text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-[13px] font-mono px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60 font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Formats individual lines within a paragraph, rendering JSON structures,
 * Input:, Output:, Explanation: labels with structured spacing and styling.
 */
function renderParagraphLines(lines: string[]): React.ReactNode {
  return lines.map((line, lIdx) => {
    const trimmed = line.trim();

    // Check if line starts with Input: or **Input:**
    const inputMatch = trimmed.match(/^(?:\*\*)?Input:?(?:\*\*)?:?\s*(.*)$/i);
    if (inputMatch) {
      const rest = inputMatch[1]?.trim();
      return (
        <div key={lIdx} className="mt-2.5 mb-1 flex items-baseline gap-2 flex-wrap text-xs sm:text-sm">
          <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">Input:</span>
          {rest ? (
            <code className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 font-mono text-xs">
              {renderInline(rest)}
            </code>
          ) : null}
        </div>
      );
    }

    // Check if line starts with Output: or **Output:**
    const outputMatch = trimmed.match(/^(?:\*\*)?Output:?(?:\*\*)?:?\s*(.*)$/i);
    if (outputMatch) {
      const rest = outputMatch[1]?.trim();
      return (
        <div key={lIdx} className="mt-1.5 mb-1 flex items-baseline gap-2 flex-wrap text-xs sm:text-sm">
          <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">Output:</span>
          {rest ? (
            <code className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 font-mono text-xs">
              {renderInline(rest)}
            </code>
          ) : null}
        </div>
      );
    }

    // Check if line starts with Explanation: or **Explanation:**
    const expMatch = trimmed.match(/^(?:\*\*)?Explanation:?(?:\*\*)?:?\s*(.*)$/i);
    if (expMatch) {
      const rest = expMatch[1]?.trim();
      return (
        <div key={lIdx} className="mt-1.5 mb-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-0.5">
          <span className="font-bold text-slate-900 dark:text-slate-100 mr-1 font-mono">
            Explanation:
          </span>
          {rest ? renderInline(rest) : null}
        </div>
      );
    }

    // Check if line is raw JSON structure like {"arr":[1,2,3]} or {"price": 204238}
    const isJsonLine =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'));

    if (isJsonLine) {
      return (
        <div key={lIdx} className="my-1.5">
          <code className="inline-block bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-mono px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 shadow-2xs">
            {trimmed}
          </code>
        </div>
      );
    }

    return (
      <div key={lIdx} className={lIdx > 0 ? 'mt-1' : ''}>
        {renderInline(line)}
      </div>
    );
  });
}

// ---------------------------------------------------------------------------
// Main Markdown Renderer Component
// ---------------------------------------------------------------------------
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const tokens = tokenise(content || '');

  const nodes = tokens.map((token, idx) => {
    switch (token.type) {
      case 'h1':
        return (
          <h1
            key={idx}
            className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800"
          >
            {renderInline(token.text)}
          </h1>
        );
      case 'h2':
        return (
          <h2
            key={idx}
            className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2"
          >
            {renderInline(token.text)}
          </h2>
        );
      case 'h3':
        return (
          <h3
            key={idx}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-6 mb-2 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/60"
          >
            {renderInline(token.text)}
          </h3>
        );
      case 'h4':
        return (
          <div key={idx} className="flex items-center gap-2 mt-5 mb-2">
            <span className="px-3 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 font-mono shadow-2xs">
              {renderInline(token.text)}
            </span>
          </div>
        );
      case 'h5':
      case 'h6':
        return (
          <h5
            key={idx}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2 mb-1"
          >
            {renderInline(token.text)}
          </h5>
        );
      case 'p':
        return (
          <div
            key={idx}
            className="text-[14px] sm:text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 mb-3 last:mb-0"
          >
            {renderParagraphLines(token.lines)}
          </div>
        );
      case 'ul':
        return (
          <ul
            key={idx}
            className="list-disc list-inside space-y-1.5 mb-3.5 text-[14px] sm:text-[15px] text-slate-800 dark:text-slate-200 pl-2 leading-relaxed"
          >
            {token.items.map((item, j) => (
              <li key={j} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol
            key={idx}
            className="list-decimal list-inside space-y-1.5 mb-3.5 text-[14px] sm:text-[15px] text-slate-800 dark:text-slate-200 pl-2 leading-relaxed"
          >
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
            className="bg-slate-900 text-emerald-300 text-xs font-mono p-3.5 rounded-lg overflow-x-auto my-3 border border-slate-800 whitespace-pre"
          >
            {token.code}
          </pre>
        );
      case 'blockquote':
        return (
          <blockquote
            key={idx}
            className="border-l-4 border-indigo-400 dark:border-indigo-600 pl-4 py-1.5 my-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-r-md text-slate-700 dark:text-slate-300 text-sm italic"
          >
            {renderInline(token.text)}
          </blockquote>
        );
      case 'table':
        return (
          <div
            key={idx}
            className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs"
          >
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                  {token.headers.map((header, hIdx) => (
                    <th
                      key={hIdx}
                      className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200"
                    >
                      {renderInline(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {token.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'hr':
        return <hr key={idx} className="my-4 border-slate-200 dark:border-slate-800" />;
      case 'blank':
        return null;
      default:
        return null;
    }
  });

  return <div className={`space-y-1 ${className}`}>{nodes}</div>;
}
