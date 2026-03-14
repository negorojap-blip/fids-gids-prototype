// Utility to generate Airline Tail Fin SVG logos

export function getTailFinSVG(airlineCode: string, width: number = 40): string {
  const code = airlineCode.toUpperCase();
  const airlines: Record<string, { b: string; f: string; type: string }> = {
    'NH': { b: '#003e80', f: '#ffffff', type: 'ana' },
    'JL': { b: '#ffffff', f: '#c8102e', type: 'jal' },
    'UA': { b: '#003366', f: '#ffffff', type: 'ua' },
    'DL': { b: '#003a70', f: '#e00034', type: 'dl' },
    'CX': { b: '#005e3c', f: '#ffffff', type: 'cx' },
    'SQ': { b: '#002552', f: '#f7c948', type: 'sq' },
    'KE': { b: '#00A1DE', f: '#ffffff', type: 'ke' },
    'CA': { b: '#ffffff', f: '#d32f2f', type: 'ca' },
    'TG': { b: '#4B2582', f: '#FFC72C', type: 'tg' },
    'QF': { b: '#e53935', f: '#ffffff', type: 'qf' }
  };

  const a = airlines[code] || { b: '#6366f1', f: '#ffffff', type: 'default' };

  const baseTailPath = "M 10 90 L 80 90 L 80 15 Q 77 10 70 15 L 20 80 Q 15 85 15 90 Z";
  const clipId = `tailClip-${code}`;
  const clipPathDef = `<clipPath id="${clipId}"><path d="M 10 90 L 80 90 L 80 15 Q 77 10 70 15 L 20 80 Q 15 85 10 90 Z" /></clipPath>`;

  let design = `<rect x="0" y="0" width="100" height="100" fill="${a.b}"/>`;
  if (a.type === 'ana') design = `<rect x="0" y="0" width="100" height="100" fill="${a.b}"/><path d="M 20 50 L 80 0 L 80 30 L 0 90 Z" fill="#4B92DB"/><path d="M 30 60 L 80 20 L 80 40 L 10 90 Z" fill="#ffffff"/>`;
  else if (a.type === 'jal') design = `<rect x="0" y="0" width="100" height="100" fill="${a.b}"/><circle cx="50" cy="50" r="25" fill="${a.f}"/>`;
  else if (a.type === 'ua') design = `<rect x="0" y="0" width="100" height="100" fill="${a.b}"/><path d="M -10 40 Q 50 -10 110 40" stroke="#f7c948" stroke-width="8" fill="none"/><path d="M -10 60 Q 50 10 110 60" stroke="#ffffff" stroke-width="8" fill="none"/>`;
  else if (a.type === 'dl') design = `<rect x="0" y="0" width="100" height="100" fill="${a.b}"/><path d="M 50 80 L 70 20 L 80 20 L 60 80 Z" fill="${a.f}"/><path d="M 60 80 L 80 20 L 90 20 L 70 80 Z" fill="#ffffff" opacity="0.8"/>`;
  else if (a.type === 'cx') design = `<rect x="0" y="0" width="100" height="100" fill="${a.b}"/><path d="M 10 80 Q 50 50 80 10 Q 70 40 40 90 Z" fill="${a.f}"/><rect x="0" y="80" width="100" height="20" fill="#d32f2f"/>`;
  else if (a.type === 'sq') design = `<rect x="0" y="0" width="100" height="100" fill="${a.b}"/><rect x="0" y="70" width="100" height="30" fill="${a.f}"/><path d="M 20 70 Q 30 40 70 30 Q 50 50 50 70 Z" fill="${a.f}"/>`;
  else if (a.type === 'ca') design = `<rect x="0" y="0" width="100" height="100" fill="${a.b}"/><circle cx="50" cy="50" r="25" fill="${a.f}"/><path d="M 35 50 L 65 50" stroke="#ffffff" stroke-width="4"/>`;
  else if (a.type === 'tg') design = `<rect x="0" y="0" width="100" height="100" fill="${a.b}"/><circle cx="50" cy="50" r="20" fill="${a.f}"/><circle cx="50" cy="50" r="25" stroke="#E6007E" stroke-width="4" fill="none"/><rect x="0" y="0" width="100" height="15" fill="#E6007E"/>`;
  else if (a.type === 'ke') design = `<rect x="0" y="0" width="100" height="100" fill="${a.b}"/><circle cx="50" cy="40" r="25" fill="${a.f}"/><path d="M 25 40 Q 50 20 75 40 Q 50 60 25 40 Z" fill="#d32f2f"/>`;
  else if (a.type === 'qf') design = `<rect x="0" y="0" width="100" height="100" fill="${a.b}"/><path d="M 30 90 Q 50 40 80 20 Q 60 50 60 90 Z" fill="${a.f}"/>`;

  return `
    <svg viewBox="0 0 100 100" width="${width}" height="${width}" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); display: block;">
      <defs>
        ${clipPathDef}
      </defs>
      <path d="${baseTailPath}" fill="#333" />
      <g clip-path="url(#${clipId})">
        ${design}
      </g>
      <path d="${baseTailPath}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
    </svg>
  `;
}
