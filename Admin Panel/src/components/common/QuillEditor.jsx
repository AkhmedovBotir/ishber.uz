/**
 * QuillEditor — React 19 compatible wrapper around Quill 2.x
 * Works directly with Quill Delta JSON ({ ops: [...] })
 *
 * Props:
 *  - defaultValue: initial Delta object
 *  - onChange(delta): called on user edits with the full Delta
 *  - readOnly: boolean
 *  - placeholder: string
 *  - minHeight: css value (default 180px)
 */

import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const DEFAULT_TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ color: [] }, { background: [] }],
  ['link'],
  ['clean'],
];

const QuillEditor = ({
  defaultValue,
  onChange,
  readOnly = false,
  placeholder,
  minHeight = '180px',
}) => {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Mount Quill once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    // Defense-in-depth: clear any leftover content from previous mounts
    // (handles React StrictMode double-invocation and HMR re-mounts)
    container.innerHTML = '';

    const editorEl = document.createElement('div');
    container.appendChild(editorEl);

    const quill = new Quill(editorEl, {
      theme: 'snow',
      readOnly,
      placeholder: placeholder || '',
      modules: {
        toolbar: readOnly ? false : DEFAULT_TOOLBAR,
      },
    });

    quillRef.current = quill;

    if (defaultValue && typeof defaultValue === 'object') {
      try {
        quill.setContents(defaultValue, 'silent');
      } catch (_) {
        // ignore invalid delta
      }
    }

    quill.on('text-change', (_delta, _oldDelta, source) => {
      if (source === 'user' && onChangeRef.current) {
        onChangeRef.current(quill.getContents());
      }
    });

    return () => {
      quillRef.current = null;
      container.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to readOnly changes
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  return (
    <div className="quill-wrapper">
      <div
        ref={containerRef}
        style={{ minHeight }}
        className={readOnly ? 'quill-readonly' : ''}
      />
      <style>{`
        .quill-wrapper .ql-toolbar.ql-snow {
          border-color: #d1d5db;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f9fafb;
        }
        .quill-wrapper .ql-container.ql-snow {
          border-color: #d1d5db;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          font-size: 14px;
          font-family: inherit;
        }
        .quill-wrapper .ql-editor {
          min-height: ${minHeight};
        }
        .quill-wrapper .quill-readonly .ql-container.ql-snow {
          border-radius: 0.5rem;
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
};

export default QuillEditor;
