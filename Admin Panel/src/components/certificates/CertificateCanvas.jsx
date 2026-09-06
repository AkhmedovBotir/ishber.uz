import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';

export const FONT_OPTIONS = [
  { label: 'Great Vibes (Kalligrafiya)', value: 'Great Vibes', category: 'cursive' },
  { label: 'Alex Brush (Elegant qo\'lyozma)', value: 'Alex Brush', category: 'cursive' },
  { label: 'Caveat (Erkin qo\'lyozma)', value: 'Caveat', category: 'cursive' },
  { label: 'Playfair Display (Klassik Serif)', value: 'Playfair Display', category: 'serif' },
  { label: 'Cinzel (Rim uslubi, Hashamatli)', value: 'Cinzel', category: 'serif' },
  { label: 'Montserrat (Zamonaviy Sans)', value: 'Montserrat', category: 'sans-serif' },
  { label: 'Inter (Sodda va Aniq)', value: 'Inter', category: 'sans-serif' },
  { label: 'Roboto (Standart Sans)', value: 'Roboto', category: 'sans-serif' },
];

/**
 * High-precision auto-fitting text SVG element
 */
const AutoFitSvgText = ({
  text,
  boxX,
  boxY,
  boxWidth,
  boxHeight,
  fontFamily,
  baseFontSize = 48,
  fontWeight = 'normal',
  color = '#000000',
  textAlign = 'center',
  uppercase = false,
  viewBoxWidth = 1920,
  viewBoxHeight = 1080
}) => {
  const textRef = useRef(null);
  const [scale, setScale] = useState(1);

  const displayText = uppercase ? (text || '').toUpperCase() : (text || '');

  // Calculate coordinates in viewBox units
  const pixelX = (boxX / 100) * viewBoxWidth;
  const pixelY = (boxY / 100) * viewBoxHeight;
  const pixelW = (boxWidth / 100) * viewBoxWidth;
  const pixelH = (boxHeight / 100) * viewBoxHeight;

  useEffect(() => {
    if (textRef.current) {
      const bbox = textRef.current.getBBox();
      if (bbox.width > 0 && bbox.height > 0) {
        // Auto scale to fit width and height constraints
        const scaleW = pixelW / bbox.width;
        const scaleH = pixelH / (bbox.height * 1.1);
        const autoScale = Math.min(1.4, scaleW, scaleH);
        setScale(autoScale);
      }
    }
  }, [displayText, pixelW, pixelH, fontFamily, fontWeight, baseFontSize]);

  let anchor = 'middle';
  let anchorX = pixelX + pixelW / 2;
  if (textAlign === 'left') {
    anchor = 'start';
    anchorX = pixelX;
  } else if (textAlign === 'right') {
    anchor = 'end';
    anchorX = pixelX + pixelW;
  }

  const centerY = pixelY + pixelH / 2;

  return (
    <g transform={`translate(${anchorX}, ${centerY})`}>
      <g transform={`scale(${scale})`}>
        <text
          ref={textRef}
          x={0}
          y={0}
          textAnchor={anchor}
          dominantBaseline="central"
          fill={color}
          style={{
            fontFamily: `"${fontFamily}", sans-serif`,
            fontSize: `${baseFontSize}px`,
            fontWeight: fontWeight,
            letterSpacing: '0.5px',
            userSelect: 'none'
          }}
        >
          {displayText}
        </text>
      </g>
    </g>
  );
};

export const CertificateCanvas = ({
  template,
  candidateName = 'Rustamov Botir Olimovich',
  vacancyTitle = 'Bosh Dasturchi (Full-Stack Engineer)',
  certificateNumber = 'ISH-2026-A78B9',
  issueDate = new Date().toISOString(),
  qrUrl = 'https://ishber.uz/verify/ISH-2026-A78B9',
  mode = 'preview', // 'preview' | 'editor'
  selectedElement = null,
  onSelectElement = () => {},
  onUpdateElement = () => {},
  className = ''
}) => {
  const containerRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [dragging, setDragging] = useState(null); // { key, startX, startY, startElX, startElY }
  const [resizing, setResizing] = useState(null); // { key, startX, startY, startW, startH }

  const originalWidth = template?.originalWidth || 1920;
  const originalHeight = template?.originalHeight || 1080;
  const elements = template?.elements || {};

  // Format date
  const formattedDate = new Date(issueDate).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Generate QR
  useEffect(() => {
    if (!qrUrl) return;
    QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 1,
      color: { dark: '#000000FF', light: '#FFFFFFFF' }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR Error:', err));
  }, [qrUrl]);

  // Drag handlers in editor mode
  const handleMouseDown = (e, key, action = 'drag') => {
    if (mode !== 'editor') return;
    e.stopPropagation();
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    const el = elements[key] || {};
    if (action === 'drag') {
      setDragging({
        key,
        startX,
        startY,
        startElX: el.x || 50,
        startElY: el.y || 50,
        containerWidth: rect.width,
        containerHeight: rect.height
      });
      onSelectElement(key);
    } else if (action === 'resize') {
      setResizing({
        key,
        startX,
        startY,
        startW: el.width || 20,
        startH: el.height || 10,
        containerWidth: rect.width,
        containerHeight: rect.height
      });
      onSelectElement(key);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragging) {
        const dx = ((e.clientX - dragging.startX) / dragging.containerWidth) * 100;
        const dy = ((e.clientY - dragging.startY) / dragging.containerHeight) * 100;

        let newX = Math.max(0, Math.min(100, dragging.startElX + dx));
        let newY = Math.max(0, Math.min(100, dragging.startElY + dy));

        onUpdateElement(dragging.key, { x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
      } else if (resizing) {
        const dx = ((e.clientX - resizing.startX) / resizing.containerWidth) * 100;
        const dy = ((e.clientY - resizing.startY) / resizing.containerHeight) * 100;

        let newW = Math.max(5, Math.min(100, resizing.startW + dx));
        let newH = Math.max(3, Math.min(100, resizing.startH + dy));

        onUpdateElement(resizing.key, { width: Math.round(newW * 10) / 10, height: Math.round(newH * 10) / 10 });
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      setResizing(null);
    };

    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, onUpdateElement]);

  const renderBoundingBox = (key, label, el) => {
    if (mode !== 'editor' || !el || el.visible === false) return null;
    const isSelected = selectedElement === key;

    return (
      <div
        key={`box-${key}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement(key);
        }}
        onMouseDown={(e) => handleMouseDown(e, key, 'drag')}
        style={{
          position: 'absolute',
          left: `${el.x}%`,
          top: `${el.y}%`,
          width: `${el.width}%`,
          height: `${el.height}%`,
          border: isSelected ? '2px solid #3b82f6' : '1.5px dashed rgba(99, 102, 241, 0.6)',
          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(99, 102, 241, 0.04)',
          borderRadius: '4px',
          cursor: 'move',
          zIndex: isSelected ? 30 : 20,
          boxSizing: 'border-box'
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '-20px',
            left: '0px',
            backgroundColor: isSelected ? '#2563eb' : '#4f46e5',
            color: 'white',
            fontSize: '10px',
            padding: '1px 6px',
            borderRadius: '3px',
            whiteSpace: 'nowrap',
            fontWeight: 600,
            pointerEvents: 'none'
          }}
        >
          {label}
        </span>
        {isSelected && (
          <div
            onMouseDown={(e) => handleMouseDown(e, key, 'resize')}
            style={{
              position: 'absolute',
              right: '-5px',
              bottom: '-5px',
              width: '10px',
              height: '10px',
              backgroundColor: '#2563eb',
              borderRadius: '2px',
              cursor: 'se-resize',
              zIndex: 35
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none shadow-md rounded-2xl border border-gray-200 bg-white ${className}`}
      style={{
        aspectRatio: `${originalWidth} / ${originalHeight}`,
      }}
      onClick={() => {
        if (mode === 'editor') onSelectElement(null);
      }}
    >
      {/* 1. Lossless background image */}
      {template?.backgroundImageUrl ? (
        <img
          src={template.backgroundImageUrl}
          alt="Certificate background"
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-400">
          <p className="text-sm font-medium">Shablon foni yuklanmagan</p>
        </div>
      )}


      {/* 2. SVG Overlay for lossless vector text rendering */}
      <svg
        viewBox={`0 0 ${originalWidth} ${originalHeight}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {/* Candidate Name */}
        {elements.name?.visible !== false && (
          <AutoFitSvgText
            text={candidateName}
            boxX={elements.name?.x ?? 50}
            boxY={elements.name?.y ?? 42}
            boxWidth={elements.name?.width ?? 60}
            boxHeight={elements.name?.height ?? 12}
            fontFamily={elements.name?.fontFamily ?? 'Great Vibes'}
            baseFontSize={elements.name?.fontSize ?? 56}
            fontWeight={elements.name?.fontWeight ?? 'normal'}
            color={elements.name?.color ?? '#0f172a'}
            textAlign={elements.name?.textAlign ?? 'center'}
            uppercase={elements.name?.uppercase ?? false}
            viewBoxWidth={originalWidth}
            viewBoxHeight={originalHeight}
          />
        )}

        {/* Vacancy Title */}
        {elements.vacancy?.visible !== false && (
          <AutoFitSvgText
            text={vacancyTitle}
            boxX={elements.vacancy?.x ?? 50}
            boxY={elements.vacancy?.y ?? 56}
            boxWidth={elements.vacancy?.width ?? 70}
            boxHeight={elements.vacancy?.height ?? 8}
            fontFamily={elements.vacancy?.fontFamily ?? 'Montserrat'}
            baseFontSize={elements.vacancy?.fontSize ?? 24}
            fontWeight={elements.vacancy?.fontWeight ?? 'bold'}
            color={elements.vacancy?.color ?? '#334155'}
            textAlign={elements.vacancy?.textAlign ?? 'center'}
            uppercase={elements.vacancy?.uppercase ?? true}
            viewBoxWidth={originalWidth}
            viewBoxHeight={originalHeight}
          />
        )}

        {/* Date */}
        {elements.date?.visible !== false && (
          <AutoFitSvgText
            text={formattedDate}
            boxX={elements.date?.x ?? 20}
            boxY={elements.date?.y ?? 84}
            boxWidth={elements.date?.width ?? 25}
            boxHeight={elements.date?.height ?? 6}
            fontFamily={elements.date?.fontFamily ?? 'Inter'}
            baseFontSize={elements.date?.fontSize ?? 18}
            fontWeight={elements.date?.fontWeight ?? '500'}
            color={elements.date?.color ?? '#475569'}
            textAlign={elements.date?.textAlign ?? 'center'}
            uppercase={false}
            viewBoxWidth={originalWidth}
            viewBoxHeight={originalHeight}
          />
        )}

        {/* Certificate Number */}
        {elements.certificateNumber?.visible !== false && (
          <AutoFitSvgText
            text={`№ ${certificateNumber}`}
            boxX={elements.certificateNumber?.x ?? 50}
            boxY={elements.certificateNumber?.y ?? 92}
            boxWidth={elements.certificateNumber?.width ?? 30}
            boxHeight={elements.certificateNumber?.height ?? 5}
            fontFamily={elements.certificateNumber?.fontFamily ?? 'Inter'}
            baseFontSize={elements.certificateNumber?.fontSize ?? 16}
            fontWeight={elements.certificateNumber?.fontWeight ?? '600'}
            color={elements.certificateNumber?.color ?? '#64748b'}
            textAlign={elements.certificateNumber?.textAlign ?? 'center'}
            uppercase={elements.certificateNumber?.uppercase ?? true}
            viewBoxWidth={originalWidth}
            viewBoxHeight={originalHeight}
          />
        )}

        {/* QR Code */}
        {elements.qr?.visible !== false && qrDataUrl && (
          <image
            href={qrDataUrl}
            x={( (elements.qr?.x ?? 84) / 100 ) * originalWidth}
            y={( (elements.qr?.y ?? 78) / 100 ) * originalHeight}
            width={( (elements.qr?.width ?? 14) / 100 ) * originalWidth}
            height={( (elements.qr?.height ?? 14) / 100 ) * originalHeight}
            preserveAspectRatio="xMidYMid meet"
          />
        )}
      </svg>

      {/* 3. Interactive Bounding Boxes in Editor Mode */}
      {mode === 'editor' && (
        <div className="absolute inset-0 pointer-events-auto">
          {renderBoundingBox('name', 'Ism-Familiya joyi', elements.name)}
          {renderBoundingBox('vacancy', 'Vakansiya / Lavozim joyi', elements.vacancy)}
          {renderBoundingBox('qr', 'QR-kod joyi', elements.qr)}
          {renderBoundingBox('date', 'Berilgan sana', elements.date)}
          {renderBoundingBox('certificateNumber', 'Sertifikat raqami', elements.certificateNumber)}
        </div>
      )}
    </div>
  );
};

/**
 * Lossless exporter: renders the certificate to a high-DPI canvas & downloads PNG
 */
export const downloadLosslessCertificate = async (certificateData, fileName = 'certificate.png') => {
  const {
    templateSnapshot,
    templateId,
    candidateName,
    vacancyTitle,
    certificateNumber,
    issueDate,
    qrVerificationUrl
  } = certificateData;

  const snapshot = templateSnapshot || templateId || {};
  const bgUrl = snapshot.backgroundImageUrl;
  const originalWidth = snapshot.originalWidth || 1920;
  const originalHeight = snapshot.originalHeight || 1080;
  const elements = snapshot.elements || {};

  // Create high-res offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = originalWidth;
  canvas.height = originalHeight;
  const ctx = canvas.getContext('2d');

  // 1. Draw lossless background image
  if (bgUrl) {
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      bgImg.onload = resolve;
      bgImg.onerror = reject;
      bgImg.src = bgUrl;
    });
    ctx.drawImage(bgImg, 0, 0, originalWidth, originalHeight);
  } else {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, originalWidth, originalHeight);
  }

  // 2. Draw QR code
  if (elements.qr?.visible !== false && qrVerificationUrl) {
    const qrDataUrl = await QRCode.toDataURL(qrVerificationUrl, {
      width: Math.round((elements.qr?.width / 100) * originalWidth * 2),
      margin: 1,
      color: { dark: '#000000FF', light: '#FFFFFFFF' }
    });
    const qrImg = new Image();
    await new Promise((res) => {
      qrImg.onload = res;
      qrImg.src = qrDataUrl;
    });
    const qX = ((elements.qr?.x || 84) / 100) * originalWidth;
    const qY = ((elements.qr?.y || 78) / 100) * originalHeight;
    const qW = ((elements.qr?.width || 14) / 100) * originalWidth;
    const qH = ((elements.qr?.height || 14) / 100) * originalHeight;
    ctx.drawImage(qrImg, qX, qY, qW, qH);
  }

  // Helper to draw auto-fitted text on canvas
  const drawAutoFitText = (text, elConfig, defaultSize = 48) => {
    if (!elConfig || elConfig.visible === false || !text) return;

    const boxX = (elConfig.x / 100) * originalWidth;
    const boxY = (elConfig.y / 100) * originalHeight;
    const boxW = (elConfig.width / 100) * originalWidth;
    const boxH = (elConfig.height / 100) * originalHeight;

    const baseSize = elConfig.fontSize || defaultSize;
    const fontFamily = elConfig.fontFamily || 'Inter';
    const fontWeight = elConfig.fontWeight || 'normal';
    const color = elConfig.color || '#000000';
    const textAlign = elConfig.textAlign || 'center';
    const uppercase = elConfig.uppercase || false;

    const str = uppercase ? text.toUpperCase() : text;

    ctx.save();
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';

    // Measure text at base font size
    ctx.font = `${fontWeight} ${baseSize}px "${fontFamily}", sans-serif`;
    const metrics = ctx.measureText(str);
    const textWidth = metrics.width;
    const textHeight = baseSize;

    // Calculate scale factor so text never exceeds boxW or boxH
    const scaleW = boxW / textWidth;
    const scaleH = boxH / (textHeight * 1.1);
    const autoScale = Math.min(1.4, scaleW, scaleH);
    const finalSize = Math.round(baseSize * autoScale);

    ctx.font = `${fontWeight} ${finalSize}px "${fontFamily}", sans-serif`;

    let posX = boxX + boxW / 2;
    ctx.textAlign = 'center';
    if (textAlign === 'left') {
      posX = boxX;
      ctx.textAlign = 'left';
    } else if (textAlign === 'right') {
      posX = boxX + boxW;
      ctx.textAlign = 'right';
    }

    const posY = boxY + boxH / 2;
    ctx.fillText(str, posX, posY);
    ctx.restore();
  };

  // Draw Candidate Name
  drawAutoFitText(candidateName, elements.name, 56);

  // Draw Vacancy Title
  drawAutoFitText(vacancyTitle, elements.vacancy, 24);

  // Draw Date
  const formattedDate = new Date(issueDate).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  drawAutoFitText(formattedDate, elements.date, 18);

  // Draw Certificate Number
  drawAutoFitText(`№ ${certificateNumber}`, elements.certificateNumber, 16);

  // Trigger lossless PNG download
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
