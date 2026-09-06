import React from 'react';

interface DeltaOp {
  insert?: string | Record<string, unknown>;
  attributes?: Record<string, unknown>;
}

interface DeltaDoc {
  ops?: DeltaOp[];
}

interface DeltaRendererProps {
  delta?: DeltaDoc | string | null;
  className?: string;
}

export const DeltaRenderer: React.FC<DeltaRendererProps> = ({ delta, className = '' }) => {
  if (!delta) {
    return <div className="text-gray-400 italic">Material matni mavjud emas</div>;
  }

  let ops: DeltaOp[] = [];
  if (typeof delta === 'string') {
    try {
      const parsed = JSON.parse(delta);
      ops = Array.isArray(parsed?.ops) ? parsed.ops : [];
    } catch {
      return <div className={`prose-content ${className}`}>{delta}</div>;
    }
  } else if (Array.isArray(delta?.ops)) {
    ops = delta.ops;
  }

  if (ops.length === 0) {
    return <div className="text-gray-400 italic">Mavzu tavsifi kiritilmagan</div>;
  }

  // Parse ops into lines and blocks
  const blocks: Array<{
    type: 'p' | 'h1' | 'h2' | 'h3' | 'blockquote' | 'code-block' | 'bullet-list' | 'ordered-list';
    inlines: Array<{ text: string; attributes?: Record<string, unknown>; isEmbed?: boolean; embedData?: any }>;
  }> = [];

  let currentInlines: Array<{ text: string; attributes?: Record<string, unknown>; isEmbed?: boolean; embedData?: any }> = [];

  for (const op of ops) {
    if (typeof op.insert === 'object' && op.insert !== null) {
      // Embed like image or video
      currentInlines.push({
        text: '',
        attributes: op.attributes,
        isEmbed: true,
        embedData: op.insert,
      });
      continue;
    }

    const text = typeof op.insert === 'string' ? op.insert : '';
    const parts = text.split('\n');

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.length > 0) {
        currentInlines.push({
          text: part,
          attributes: op.attributes,
        });
      }

      // If we hit a newline (or between parts)
      if (i < parts.length - 1) {
        // Look at block attribute on this newline
        const lineAttr = op.attributes || {};
        let blockType: 'p' | 'h1' | 'h2' | 'h3' | 'blockquote' | 'code-block' | 'bullet-list' | 'ordered-list' = 'p';

        if (lineAttr.header === 1) blockType = 'h1';
        else if (lineAttr.header === 2) blockType = 'h2';
        else if (lineAttr.header === 3) blockType = 'h3';
        else if (lineAttr.blockquote) blockType = 'blockquote';
        else if (lineAttr['code-block']) blockType = 'code-block';
        else if (lineAttr.list === 'bullet') blockType = 'bullet-list';
        else if (lineAttr.list === 'ordered') blockType = 'ordered-list';

        blocks.push({
          type: blockType,
          inlines: [...currentInlines],
        });
        currentInlines = [];
      }
    }
  }

  if (currentInlines.length > 0) {
    blocks.push({
      type: 'p',
      inlines: [...currentInlines],
    });
  }

  const renderInline = (inline: { text: string; attributes?: Record<string, unknown>; isEmbed?: boolean; embedData?: any }, idx: number) => {
    if (inline.isEmbed && inline.embedData) {
      if (inline.embedData.image) {
        return (
          <img
            key={idx}
            src={inline.embedData.image}
            alt="Embedded content"
            className="rounded-lg my-3 max-w-full shadow-sm"
          />
        );
      }
      return null;
    }

    const attr = inline.attributes || {};
    let node: React.ReactNode = inline.text;

    if (attr.bold) node = <strong key={`b-${idx}`}>{node}</strong>;
    if (attr.italic) node = <em key={`i-${idx}`}>{node}</em>;
    if (attr.underline) node = <u key={`u-${idx}`}>{node}</u>;
    if (attr.strike) node = <s key={`s-${idx}`}>{node}</s>;
    if (attr.code) {
      node = (
        <code
          key={`c-${idx}`}
          className="bg-gray-100 text-purple-700 px-1.5 py-0.5 rounded text-[0.9em] font-mono"
        >
          {node}
        </code>
      );
    }
    if (attr.link) {
      node = (
        <a
          key={`a-${idx}`}
          href={String(attr.link)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline font-medium"
        >
          {node}
        </a>
      );
    }
    if (attr.color) {
      node = (
        <span key={`col-${idx}`} style={{ color: String(attr.color) }}>
          {node}
        </span>
      );
    }
    if (attr.background) {
      node = (
        <span key={`bg-${idx}`} style={{ backgroundColor: String(attr.background), padding: '0 2px' }}>
          {node}
        </span>
      );
    }

    return <React.Fragment key={idx}>{node}</React.Fragment>;
  };

  return (
    <div className={`edtech-delta-content ${className}`}>
      {blocks.map((block, bIdx) => {
        if (block.inlines.length === 0) {
          return <div key={bIdx} className="h-4" />;
        }

        switch (block.type) {
          case 'h1':
            return (
              <h1 key={bIdx} className="text-2xl font-bold text-gray-900 mt-6 mb-3 leading-snug">
                {block.inlines.map(renderInline)}
              </h1>
            );
          case 'h2':
            return (
              <h2 key={bIdx} className="text-xl font-bold text-gray-800 mt-5 mb-2.5 leading-snug">
                {block.inlines.map(renderInline)}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={bIdx} className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                {block.inlines.map(renderInline)}
              </h3>
            );
          case 'blockquote':
            return (
              <blockquote
                key={bIdx}
                className="border-l-4 border-blue-500 bg-blue-50/50 pl-4 py-2 my-3 text-gray-700 italic rounded-r"
              >
                {block.inlines.map(renderInline)}
              </blockquote>
            );
          case 'code-block':
            return (
              <pre
                key={bIdx}
                className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto my-3 font-mono text-sm shadow-inner"
              >
                <code>{block.inlines.map((i) => i.text).join('')}</code>
              </pre>
            );
          case 'bullet-list':
            return (
              <div key={bIdx} className="flex items-start gap-2.5 my-1.5 pl-2">
                <span className="text-blue-500 font-bold text-lg leading-tight">•</span>
                <span className="text-gray-800 leading-relaxed">{block.inlines.map(renderInline)}</span>
              </div>
            );
          case 'ordered-list':
            return (
              <div key={bIdx} className="flex items-start gap-2.5 my-1.5 pl-2">
                <span className="font-semibold text-blue-600 text-sm leading-6 min-w-[20px]">{bIdx + 1}.</span>
                <span className="text-gray-800 leading-relaxed">{block.inlines.map(renderInline)}</span>
              </div>
            );
          case 'p':
          default:
            return (
              <p key={bIdx} className="my-2.5 text-gray-800 leading-relaxed text-[16px]">
                {block.inlines.map(renderInline)}
              </p>
            );
        }
      })}
    </div>
  );
};
