import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface ElementConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  uppercase?: boolean;
  visible?: boolean;
}

interface TemplateData {
  backgroundImageUrl?: string;
  originalWidth?: number;
  originalHeight?: number;
  elements?: {
    name?: ElementConfig;
    vacancy?: ElementConfig;
    qr?: ElementConfig;
    date?: ElementConfig;
    certificateNumber?: ElementConfig;
  };
}

interface AutoFitSvgTextProps {
  text: string;
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
  fontFamily?: string;
  baseFontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  uppercase?: boolean;
  viewBoxWidth: number;
  viewBoxHeight: number;
}

const AutoFitSvgText: React.FC<AutoFitSvgTextProps> = ({
  text,
  boxX,
  boxY,
  boxWidth,
  boxHeight,
  fontFamily = 'Inter',
  baseFontSize = 48,
  fontWeight = 'normal',
  color = '#000000',
  textAlign = 'center',
  uppercase = false,
  viewBoxWidth,
  viewBoxHeight
}) => {
  const textRef = useRef<SVGTextElement>(null);
  const [scale, setScale] = useState(1);

  const displayText = uppercase ? (text || '').toUpperCase() : (text || '');

  const pixelX = (boxX / 100) * viewBoxWidth;
  const pixelY = (boxY / 100) * viewBoxHeight;
  const pixelW = (boxWidth / 100) * viewBoxWidth;
  const pixelH = (boxHeight / 100) * viewBoxHeight;

  useEffect(() => {
    if (textRef.current) {
      const bbox = textRef.current.getBBox();
      if (bbox.width > 0 && bbox.height > 0) {
        const scaleW = pixelW / bbox.width;
        const scaleH = pixelH / (bbox.height * 1.1);
        const autoScale = Math.min(1.4, scaleW, scaleH);
        setScale(autoScale);
      }
    }
  }, [displayText, pixelW, pixelH, fontFamily, fontWeight, baseFontSize]);

  let anchor: 'start' | 'middle' | 'end' = 'middle';
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

export interface CandidateCertificateCanvasProps {
  template: TemplateData;
  candidateName: string;
  vacancyTitle: string;
  certificateNumber: string;
  issueDate?: string;
  qrUrl?: string;
  className?: string;
}

export const CandidateCertificateCanvas: React.FC<CandidateCertificateCanvasProps> = ({
  template,
  candidateName,
  vacancyTitle,
  certificateNumber,
  issueDate = new Date().toISOString(),
  qrUrl,
  className = ''
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const originalWidth = template?.originalWidth || 1920;
  const originalHeight = template?.originalHeight || 1080;
  const elements = template?.elements || {};

  const formattedDate = new Date(issueDate).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  useEffect(() => {
    if (!qrUrl) return;
    QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 1,
      color: { dark: '#000000FF', light: '#FFFFFFFF' }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR Error:', err));
  }, [qrUrl]);

  return (
    <div
      className={`relative w-full overflow-hidden select-none shadow-2xl rounded-2xl border border-slate-700/60 bg-slate-900 ${className}`}
      style={{
        aspectRatio: `${originalWidth} / ${originalHeight}`
      }}
    >
      {/* 1. Lossless template background image */}
      {template?.backgroundImageUrl ? (
        <img
          src={template.backgroundImageUrl}
          alt="Certificate background"
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-400">
          <p className="text-sm font-medium">Fon rasmi mavjud emas</p>
        </div>
      )}

      {/* 2. SVG Vector Layer with Auto-Fitting text */}
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
            x={((elements.qr?.x ?? 84) / 100) * originalWidth}
            y={((elements.qr?.y ?? 78) / 100) * originalHeight}
            width={((elements.qr?.width ?? 14) / 100) * originalWidth}
            height={((elements.qr?.height ?? 14) / 100) * originalHeight}
            preserveAspectRatio="xMidYMid meet"
          />
        )}
      </svg>
    </div>
  );
};

export const downloadLosslessCandidateCertificate = async (
  certificateData: any,
  fileName: string = 'Sertifikat.png'
) => {
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

  const canvas = document.createElement('canvas');
  canvas.width = originalWidth;
  canvas.height = originalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw lossless background
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
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, originalWidth, originalHeight);
  }

  // 2. Draw QR code
  if (elements.qr?.visible !== false && qrVerificationUrl) {
    const qrDataUrl = await QRCode.toDataURL(qrVerificationUrl, {
      width: Math.round(((elements.qr?.width || 14) / 100) * originalWidth * 2),
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

  const drawAutoFitText = (text: string, elConfig: ElementConfig | undefined, defaultSize: number = 48) => {
    if (!elConfig || elConfig.visible === false || !text) return;

    const boxX = ((elConfig.x || 50) / 100) * originalWidth;
    const boxY = ((elConfig.y || 50) / 100) * originalHeight;
    const boxW = ((elConfig.width || 50) / 100) * originalWidth;
    const boxH = ((elConfig.height || 10) / 100) * originalHeight;

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

    ctx.font = `${fontWeight} ${baseSize}px "${fontFamily}", sans-serif`;
    const metrics = ctx.measureText(str);
    const textWidth = metrics.width;
    const textHeight = baseSize;

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

  drawAutoFitText(candidateName, elements.name, 56);
  drawAutoFitText(vacancyTitle, elements.vacancy, 24);

  const formattedDate = new Date(issueDate).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  drawAutoFitText(formattedDate, elements.date, 18);
  drawAutoFitText(`№ ${certificateNumber}`, elements.certificateNumber, 16);

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
