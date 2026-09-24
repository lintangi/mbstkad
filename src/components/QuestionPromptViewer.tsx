import React from 'react';
import { QuestionAttachment } from '../types';
import { LatexRenderer } from '../utils/latexParser';
import { normalizeGoogleDriveImageUrl, handleDriveImageError } from '../utils/googleDriveUtils';

interface QuestionPromptViewerProps {
  prompt: string;
  attachments?: QuestionAttachment[];
  className?: string;
  isExamMode?: boolean;
}

export const QuestionPromptViewer: React.FC<QuestionPromptViewerProps> = ({
  prompt,
  attachments = [],
  className = '',
  isExamMode = false,
}) => {
  // Categorize attachments by position
  const topAttachments = attachments.filter((a) => a.position === 'top');
  const middleAttachments = attachments.filter((a) => a.position === 'middle');
  const bottomAttachments = attachments.filter(
    (a) => !a.position || a.position === 'bottom'
  );

  const renderSingleAttachment = (att: QuestionAttachment) => {
    const alignClass =
      att.align === 'left'
        ? 'text-left'
        : att.align === 'right'
        ? 'text-right'
        : 'text-center';

    const alignImgClass =
      att.align === 'left'
        ? 'mr-auto ml-0'
        : att.align === 'right'
        ? 'ml-auto mr-0'
        : 'mx-auto';

    const widthStyle = att.width ? `${att.width}%` : '100%';
    const resolvedUrl = normalizeGoogleDriveImageUrl(att.url);

    return (
      <div key={att.id} className={`my-3 ${alignClass}`}>
        <img
          src={resolvedUrl}
          alt={att.name}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          loading="lazy"
          style={{ width: widthStyle }}
          className={`max-h-96 rounded-xl border border-slate-200 dark:border-slate-700 object-contain shadow-xs ${alignImgClass}`}
          onError={(e) => handleDriveImageError(e, att.url)}
        />
        {/* Sumber Media / Gambar (Input Manual) */}
        {(att.source || att.name) && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 block italic font-medium">
            {att.source
              ? (att.source.trim().toLowerCase().startsWith('sumber') ? att.source : `Sumber: ${att.source}`)
              : `Sumber: ${att.name}`}
          </span>
        )}
      </div>
    );
  };

  // If prompt has placeholder tags like {{gambar:1}}, replace them
  // Or if middle attachments exist and prompt has multiple paragraphs, place them between paragraphs
  const renderPromptBody = () => {
    // Check for explicit placeholders like {{gambar:1}} or {{gambar}}
    const hasExplicitPlaceholder = /\{\{gambar(?::\d+)?\}\}/i.test(prompt);

    if (hasExplicitPlaceholder) {
      const parts = prompt.split(/(\{\{gambar(?::\d+)?\}\})/i);
      let imgCounter = 0;

      return (
        <div className="space-y-2">
          {parts.map((part, idx) => {
            const match = part.match(/\{\{gambar(?::(\d+))?\}\}/i);
            if (match) {
              const explicitIdx = match[1] ? parseInt(match[1], 10) - 1 : imgCounter++;
              const att = attachments[explicitIdx];
              if (att) {
                return <div key={`placeholder-${idx}`}>{renderSingleAttachment(att)}</div>;
              }
              return null;
            }
            return <LatexRenderer key={`part-${idx}`} content={part} />;
          })}
        </div>
      );
    }

    // Split paragraphs
    const paragraphs = prompt.split(/\n\s*\n/);

    if (middleAttachments.length > 0 && paragraphs.length > 1) {
      const midPoint = Math.floor(paragraphs.length / 2);
      const firstHalf = paragraphs.slice(0, midPoint).join('\n\n');
      const secondHalf = paragraphs.slice(midPoint).join('\n\n');

      return (
        <div className="space-y-2">
          <LatexRenderer content={firstHalf} />
          {middleAttachments.map(renderSingleAttachment)}
          <LatexRenderer content={secondHalf} />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <LatexRenderer content={prompt} />
        {middleAttachments.map(renderSingleAttachment)}
      </div>
    );
  };

  return (
    <div className={`leading-relaxed ${className}`}>
      {/* Top Attachments */}
      {topAttachments.length > 0 && (
        <div className="space-y-3 mb-3">
          {topAttachments.map(renderSingleAttachment)}
        </div>
      )}

      {/* Main Prompt Body */}
      {renderPromptBody()}

      {/* Bottom Attachments */}
      {bottomAttachments.length > 0 && (
        <div className="space-y-3 mt-3">
          {bottomAttachments.map(renderSingleAttachment)}
        </div>
      )}
    </div>
  );
};
