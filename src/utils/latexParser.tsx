import React from 'react';
import katex from 'katex';

interface LatexRendererProps {
  content: string;
  className?: string;
}

/**
 * Checks if a block of text is a Markdown table.
 */
function isMarkdownTable(text: string): boolean {
  const lines = text.trim().split('\n').map((l) => l.trim());
  if (lines.length < 2) return false;
  // Header row must contain |
  if (!lines[0].startsWith('|') && !lines[0].includes('|')) return false;
  // Second row must be separator (e.g. |---|---| or |:---|:---|)
  const sep = lines[1];
  return /^[|:\-\s]+$/.test(sep) && sep.includes('-');
}

/**
 * Parses a single text segment containing inline or block math ($...$ or $$...$$).
 */
export const MathFormulaSpan: React.FC<{ text: string }> = ({ text }) => {
  const parts: React.ReactNode[] = [];
  const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const raw = match[0];
    const isBlock = raw.startsWith('$$') && raw.endsWith('$$');
    const formula = isBlock ? raw.slice(2, -2).trim() : raw.slice(1, -1).trim();

    try {
      const html = katex.renderToString(formula, {
        displayMode: isBlock,
        throwOnError: false,
      });

      parts.push(
        <span
          key={`katex-${match.index}`}
          className={isBlock ? 'my-2 block overflow-x-auto text-center py-1 font-serif' : 'inline-block px-0.5 align-baseline'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      parts.push(
        <code key={`err-${match.index}`} className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-red-600 dark:text-red-400 text-xs font-mono">
          {raw}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
};

/**
 * Parses text containing LaTeX notation and Markdown tables:
 * - Inline math: $x^2 + y^2 = r^2$
 * - Block math: $$\\frac{a}{b}$$
 * - Markdown tables: | Kolom 1 | Kolom 2 | \n |---|---| \n | Data 1 | Data 2 |
 */
export const LatexRenderer: React.FC<LatexRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split content into blocks by double newlines or table boundaries
  const lines = content.split('\n');
  const blocks: { type: 'table' | 'text'; lines: string[] }[] = [];
  let currentBlock: { type: 'table' | 'text'; lines: string[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isTableLine = trimmed.startsWith('|') || (trimmed.endsWith('|') && trimmed.includes('|'));

    if (isTableLine) {
      if (currentBlock && currentBlock.type === 'table') {
        currentBlock.lines.push(line);
      } else {
        if (currentBlock && currentBlock.lines.length > 0) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'table', lines: [line] };
      }
    } else {
      if (currentBlock && currentBlock.type === 'text') {
        currentBlock.lines.push(line);
      } else {
        if (currentBlock && currentBlock.lines.length > 0) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'text', lines: [line] };
      }
    }
  }
  if (currentBlock && currentBlock.lines.length > 0) {
    blocks.push(currentBlock);
  }

  return (
    <div className={`prose-sm leading-relaxed text-slate-800 dark:text-slate-100 ${className}`}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'table' && isMarkdownTable(block.lines.join('\n'))) {
          const rawLines = block.lines.map((l) => l.trim()).filter(Boolean);
          const headerCells = rawLines[0]
            .split('|')
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx !== 0 && idx !== arr.length - 1);

          const bodyRows = rawLines.slice(2).map((rowLine) =>
            rowLine
              .split('|')
              .map((c) => c.trim())
              .filter((c, idx, arr) => idx !== 0 && idx !== arr.length - 1)
          );

          return (
            <div key={`tbl-${bIdx}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx} className="px-3.5 py-2.5 font-bold border-r last:border-r-0 border-slate-200 dark:border-slate-700">
                        <MathFormulaSpan text={h} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/60 transition">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                          <MathFormulaSpan text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Normal text block
        const textContent = block.lines.join('\n');
        return (
          <div key={`txt-${bIdx}`} className={bIdx > 0 ? 'mt-2' : ''}>
            {block.lines.map((l, lIdx) => (
              <React.Fragment key={lIdx}>
                <MathFormulaSpan text={l} />
                {lIdx < block.lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        );
      })}
    </div>
  );
};
