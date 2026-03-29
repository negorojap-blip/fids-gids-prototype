import { h } from 'preact';
import { getTailFinSVG } from '../../utils/tailFin';
import { FidsClock } from './FidsClock';

export interface Flight {
  id: number;
  time: string;
  destination: Record<string, string>;
  flightNumber: string;
  airline: Record<string, string>;
  airlineCode: string;
  gate: string;
  status: Record<string, string>;
}

export interface FidsStyle {
  columns: string[];
  fontSize: 'S' | 'M' | 'L';
  theme: 'dark' | 'blue' | 'green';
  maxRows: number;
  headerTitle: string;
}

export interface FidsTemplateProps {
  flights: Flight[];
  lang: string;
  timeStr: string;
  dateStr: string;
  activeLangs: string[];
  isVisible?: boolean;
  fidsStyle?: FidsStyle;
}

const HEADER_LABELS: Record<string, Record<string, string>> = {
  time: { ja: '時刻', en: 'TIME', zh: '时间', ko: '시각' },
  destination: { ja: '行先', en: 'DESTINATION', zh: '目的地', ko: '행선지' },
  flight: { ja: '便名', en: 'FLIGHT', zh: '航班', ko: '편명' },
  airline: { ja: '航空会社', en: 'AIRLINE', zh: '航空公司', ko: '항공사' },
  gate: { ja: 'ゲート', en: 'GATE', zh: '登机口', ko: '게이트' },
  status: { ja: '備考', en: 'REMARKS', zh: '备注', ko: '비고' },
  terminal: { ja: 'ターミナル', en: 'TERMINAL', zh: '航站楼', ko: '터미널' },
  checkin: { ja: 'チェックイン', en: 'CHECK-IN', zh: '值机', ko: '체크인' },
  codeshare: { ja: '共同運航', en: 'CODESHARE', zh: '代码共享', ko: '코드쉐어' },
};

const TITLE_LABELS: Record<string, string> = {
  ja: '出発便案内', en: 'DEPARTURES', zh: '出发航班', ko: '출발편 안내',
};

const CODESHARES = ['NH*', 'JL*', '', 'UA*', '', 'SQ*', '', 'CX*', '', 'QF*', '', 'NH*', '', 'JL*', '', 'DL*', '', 'KE*'];
const TERMINALS = ['T1', 'T1', 'T2', 'T1', 'T2', 'T2', 'T1', 'T1', 'T2', 'T1', 'T2', 'T1', 'T1', 'T2', 'T2', 'T1', 'T2', 'T1'];
const CHECKINS = ['A01-A05', 'B10-B14', 'C01-C03', 'A06-A10', 'D01-D04', 'B15-B18', 'A11-A15', 'C04-C08', 'D05-D08', 'A16-A20',
  'B01-B05', 'C09-C12', 'A21-A25', 'D09-D12', 'B06-B09', 'C13-C16', 'A26-A30', 'D13-D16'];

// Theme color definitions
const THEMES: Record<string, { bg: string; headerBg: string; headerAccent: string; rowEven: string; rowOdd: string; text: string; timeColor: string }> = {
  dark: {
    bg: '#0a0e1a',
    headerBg: 'rgba(0,0,0,0.4)',
    headerAccent: '#fbbf24',
    rowEven: 'rgba(255,255,255,0.03)',
    rowOdd: 'transparent',
    text: '#e2e8f0',
    timeColor: '#fbbf24',
  },
  blue: {
    bg: '#0b1a3a',
    headerBg: 'rgba(30,64,130,0.5)',
    headerAccent: '#60a5fa',
    rowEven: 'rgba(96,165,250,0.06)',
    rowOdd: 'transparent',
    text: '#dbeafe',
    timeColor: '#93c5fd',
  },
  green: {
    bg: '#0a1a0f',
    headerBg: 'rgba(20,80,40,0.5)',
    headerAccent: '#4ade80',
    rowEven: 'rgba(74,222,128,0.05)',
    rowOdd: 'transparent',
    text: '#dcfce7',
    timeColor: '#86efac',
  },
};

const FONT_SIZES: Record<string, { base: string; header: string; title: string; badge: string }> = {
  S: { base: '0.85rem', header: '0.7rem', title: '1.2rem', badge: '0.65rem' },
  M: { base: '1rem', header: '0.82rem', title: '1.5rem', badge: '0.75rem' },
  L: { base: '1.2rem', header: '0.95rem', title: '1.8rem', badge: '0.85rem' },
};

function getStatusClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('on time') || s.includes('定刻') || s.includes('准时') || s.includes('정시')) return 'status-ontime';
  if (s.includes('boarding') || s.includes('搭乗中') || s.includes('登机中') || s.includes('탑승 중')) return 'status-boarding';
  if (s.includes('now boarding') || s.includes('搭乗案内') || s.includes('即将登机') || s.includes('탑승 안내')) return 'status-nowboarding';
  if (s.includes('delayed') || s.includes('遅延') || s.includes('延误') || s.includes('지연')) return 'status-delayed';
  if (s.includes('departed') || s.includes('出発済') || s.includes('已起飞') || s.includes('출발')) return 'status-departed';
  if (s.includes('cancelled') || s.includes('欠航') || s.includes('取消') || s.includes('결항')) return 'status-cancelled';
  if (s.includes('gate changed') || s.includes('ゲート変更') || s.includes('登机口变更') || s.includes('게이트 변경')) return 'status-delayed';
  return '';
}

const ALL_COLUMNS = ['time', 'destination', 'flight', 'logo', 'airline', 'gate', 'status', 'terminal', 'checkin', 'codeshare'];

export function FidsTemplateA({ flights, lang, timeStr, dateStr, activeLangs, isVisible = true, fidsStyle }: FidsTemplateProps) {
  const style = fidsStyle || {
    columns: ALL_COLUMNS,
    fontSize: 'M' as const,
    theme: 'dark' as const,
    maxRows: 0,
    headerTitle: '',
  };

  const theme = THEMES[style.theme] || THEMES.dark;
  const fonts = FONT_SIZES[style.fontSize] || FONT_SIZES.M;
  const visibleCols = new Set(style.columns || ALL_COLUMNS);

  const customTitle = style.headerTitle
    ? style.headerTitle
    : `✈ ${TITLE_LABELS[lang] || TITLE_LABELS.en}`;
  const badge = lang.toUpperCase();
  const langListStr = activeLangs.map(l => l.toUpperCase()).join(' / ');

  const getLabel = (key: string) => HEADER_LABELS[key]?.[lang] || HEADER_LABELS[key]?.en || '';

  // Apply maxRows
  const displayFlights = style.maxRows > 0 ? flights.slice(0, style.maxRows) : flights;

  // Column rendering helper
  const showCol = (col: string) => visibleCols.has(col);

  return (
    <div className="fids-container" style={{ background: theme.bg, color: theme.text, fontSize: fonts.base }}>
      <div className="fids-header" style={{ background: theme.headerBg }}>
        <h1 style={{ color: theme.headerAccent, fontSize: fonts.title }}>{customTitle}</h1>
        <div className="header-right">
          <span style={{ fontSize: fonts.badge, opacity: 0.7 }}>{langListStr}</span>
          <span style={{ background: `${theme.headerAccent}22`, color: theme.headerAccent, padding: '4px 12px', borderRadius: '6px', fontWeight: 700, fontSize: fonts.badge }}>
            {badge}
          </span>
          <FidsClock />
        </div>
      </div>

      <div className="fids-table-container">
        <table className="fids-table" style={{ fontSize: fonts.base }}>
          <thead>
            <tr style={{ color: theme.headerAccent }}>
              {showCol('time') && <th className="col-time">{getLabel('time')}</th>}
              {showCol('destination') && <th className="col-dest">{getLabel('destination')}</th>}
              {showCol('flight') && <th className="col-flight">{getLabel('flight')}</th>}
              {showCol('logo') && <th className="col-logo"></th>}
              {showCol('airline') && <th className="col-airline">{getLabel('airline')}</th>}
              {showCol('gate') && <th className="col-gate">{getLabel('gate')}</th>}
              {showCol('status') && <th className="col-status">{getLabel('status')}</th>}
              {showCol('terminal') && <th className="col-terminal">{getLabel('terminal')}</th>}
              {showCol('checkin') && <th className="col-checkin">{getLabel('checkin')}</th>}
              {showCol('codeshare') && <th className="col-codeshare">{getLabel('codeshare')}</th>}
            </tr>
          </thead>
          <tbody style={{ 
              opacity: isVisible ? 1 : 0, 
              transition: 'opacity 0.4s ease',
            }}>
            {displayFlights.map((f, i) => {
              const dest = f.destination[lang] || f.destination.en;
              const airlineName = f.airline[lang] || f.airline.en;
              const statusText = f.status[lang] || f.status.en;
              const statusClass = `col-status ${getStatusClass(statusText)}`;
              const codeshare = CODESHARES[i % CODESHARES.length];
              const terminal = TERMINALS[i % TERMINALS.length];
              const checkin = CHECKINS[i % CHECKINS.length];
              const rowBg = i % 2 === 0 ? theme.rowEven : theme.rowOdd;

              return (
                <tr key={f.id} style={{ background: rowBg }}>
                  {showCol('time') && <td className="col-time" style={{ fontWeight: 700, color: theme.timeColor }}>{f.time}</td>}
                  {showCol('destination') && <td className="col-dest">{dest}</td>}
                  {showCol('flight') && <td className="col-flight" style={{ fontWeight: 700, letterSpacing: '0.05em' }}>{f.flightNumber}</td>}
                  {showCol('logo') && (
                    <td className="col-logo">
                      <div 
                        className="airline-logo-container" 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        dangerouslySetInnerHTML={{ __html: getTailFinSVG(f.airlineCode, 36) }}
                      />
                    </td>
                  )}
                  {showCol('airline') && <td className="col-airline">{airlineName}</td>}
                  {showCol('gate') && <td className="col-gate" style={{ fontWeight: 700 }}>{f.gate}</td>}
                  {showCol('status') && <td className={statusClass} style={{ fontWeight: 600 }}>{statusText}</td>}
                  {showCol('terminal') && <td className="col-terminal" style={{ color: 'rgba(255,255,255,0.5)' }}>{terminal}</td>}
                  {showCol('checkin') && <td className="col-checkin" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{checkin}</td>}
                  {showCol('codeshare') && <td className="col-codeshare" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>{codeshare}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
