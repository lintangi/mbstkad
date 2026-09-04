import React from 'react';
import katex from 'katex';

interface LatexRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses text containing LaTeX notation like:
 * - Inline math: $x^2 + y^2 = r^2$ or \\( ... \\)
 * - Block math: $$\\frac{a}{b}$$ or \\[ ... \\]
 * Also renders basic line breaks and simple formatting.
 */
export const LatexRenderer: React.FC<LatexRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split content by block math ($$...$$) first, then inline math ($...$)
  const renderFormattedContent = (text: string) => {
    // Regular expression to match $$...$$ and $...$
    const parts: React.ReactNode[] = [];
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // Push preceding plain text
      if (match.index > lastIndex) {
        const plainText = text.substring(lastIndex, match.index);
        parts.push(<span key={`text-${lastIndex}`}>{renderPlainTextWithBreaks(plainText)}</span>);
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
            className={isBlock ? 'my-2 block overflow-x-auto text-center py-1 font-serif' : 'inline-block px-1 align-baseline'}
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
      parts.push(
        <span key={`text-${lastIndex}`}>
          {renderPlainTextWithBreaks(text.substring(lastIndex))}
        </span>
      );
    }

    return parts;
  };

  const renderPlainTextWithBreaks = (text: string) => {
    return text.split('\n').map((line, i, arr) => (
      <React.Fragment key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return <div className={`prose-sm leading-relaxed text-slate-800 dark:text-slate-100 ${className}`}>{renderFormattedContent(content)}</div>;
};
