import { useEffect, useRef, useCallback, useState } from 'preact/hooks';
import { EmergencyScreen, EmergencyType } from '../components/EmergencyScreen';

// =============================================
// Types
// =============================================
interface Flight {
  id: number;
  time: string;
  destination: Record<string, string>;
  flightNumber: string;
  airline: Record<string, string>;
  airlineCode: string;
  gate: string;
  status: Record<string, string>;
}

interface FidsConfig {
  languages: string[];
  interval: number;
}

// =============================================
// Constants
// =============================================
const AIRLINE_COLORS: Record<string, string> = {
  NH: '#003e80', JL: '#c8102e', UA: '#003366', DL: '#003a70',
  CX: '#005e3c', SQ: '#f7c948', KE: '#003a6e', CA: '#d32f2f',
  TG: '#6a1b9a', QF: '#e53935',
};

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

// =============================================
// Cached DOM references — filled once at build time
// =============================================
interface RowCache {
  time: HTMLElement;
  dest: HTMLElement;
  flight: HTMLElement;
  logo: HTMLElement;
  airline: HTMLElement;
  gate: HTMLElement;
  status: HTMLElement;
}

interface HeaderCache {
  title: HTMLElement;
  langBadge: HTMLElement;
  langList: HTMLElement;
  clock: HTMLElement;
  date: HTMLElement;
  ths: HTMLElement[]; // 10 th elements
}

// =============================================
// Component — Preact only provides a single <div> mount point.
// Everything else is pure DOM.
// =============================================
export function Fids() {
  const rootRef = useRef<HTMLDivElement>(null);
  const built = useRef(false);
  const rows = useRef<RowCache[]>([]);
  const header = useRef<HeaderCache | null>(null);
  const tbody = useRef<HTMLElement | null>(null);

  const flights = useRef<Flight[]>([]);
  const config = useRef<FidsConfig>({ languages: ['ja', 'en'], interval: 5 });
  const prevFlightsJson = useRef('');
  const prevConfigKey = useRef('');
  const currentLangIdx = useRef(0);
  const langTimerRef = useRef<number | null>(null);

  const [emergencyType, setEmergencyType] = useState<EmergencyType>(null);

  // ---- Build entire DOM tree once ----
  const buildAll = useCallback(() => {
    const root = rootRef.current;
    if (!root || built.current) return;
    built.current = true;

    root.className = 'fids-container';
    root.innerHTML = '';

    // Header
    const hdr = document.createElement('div');
    hdr.className = 'fids-header';

    const h1 = document.createElement('h1');
    h1.textContent = '✈ 出発便案内';

    const hdrRight = document.createElement('div');
    hdrRight.className = 'header-right';

    const langList = document.createElement('span');
    langList.style.cssText = 'font-size:0.75rem;opacity:0.7;';
    const langBadge = document.createElement('span');
    langBadge.style.cssText = 'background:rgba(251,191,36,0.15);padding:4px 12px;border-radius:6px;font-weight:700;';
    const dateEl = document.createElement('span');
    const clockEl = document.createElement('span');
    clockEl.style.cssText = 'font-variant-numeric:tabular-nums;font-weight:700;font-size:1.1rem;';

    hdrRight.append(langList, langBadge, dateEl, clockEl);
    hdr.append(h1, hdrRight);
    root.appendChild(hdr);

    // Table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'fids-table-container';

    const table = document.createElement('table');
    table.className = 'fids-table';

    // Thead
    const thead = document.createElement('thead');
    const thRow = document.createElement('tr');
    const thClasses = ['col-time', 'col-dest', 'col-flight', 'col-logo', 'col-airline', 'col-gate', 'col-status', 'col-terminal', 'col-checkin', 'col-codeshare'];
    const thDefaults = ['時刻', '行先', '便名', '', '航空会社', 'ゲート', '備考', 'ターミナル', 'チェックイン', '共同運航'];
    const thElements: HTMLElement[] = [];
    for (let i = 0; i < 10; i++) {
      const th = document.createElement('th');
      th.className = thClasses[i];
      th.textContent = thDefaults[i];
      thRow.appendChild(th);
      thElements.push(th);
    }
    thead.appendChild(thRow);
    table.appendChild(thead);

    // Tbody
    const tbodyEl = document.createElement('tbody');
    tbodyEl.style.cssText = 'opacity:1;transition:opacity 0.4s ease;will-change:opacity;';
    const rowCaches: RowCache[] = [];

    for (let i = 0; i < flights.current.length; i++) {
      const tr = document.createElement('tr');
      tr.className = i % 2 === 0 ? 'fids-row-even' : 'fids-row-odd';

      const tdTime = document.createElement('td');
      tdTime.className = 'col-time';
      tdTime.style.cssText = 'font-weight:700;color:#fbbf24;';

      const tdDest = document.createElement('td');
      tdDest.className = 'col-dest';

      const tdFlight = document.createElement('td');
      tdFlight.className = 'col-flight';
      tdFlight.style.cssText = 'font-weight:700;letter-spacing:0.05em;';

      const tdLogoWrap = document.createElement('td');
      tdLogoWrap.className = 'col-logo';
      const divLogo = document.createElement('img');
      divLogo.className = 'airline-logo';
      divLogo.style.cssText = 'height:30px;width:auto;object-fit:contain;';
      tdLogoWrap.appendChild(divLogo);

      const tdAirline = document.createElement('td');
      tdAirline.className = 'col-airline';

      const tdGate = document.createElement('td');
      tdGate.className = 'col-gate';
      tdGate.style.fontWeight = '700';

      const tdStatus = document.createElement('td');
      tdStatus.className = 'col-status';
      tdStatus.style.fontWeight = '600';

      const tdTerminal = document.createElement('td');
      tdTerminal.className = 'col-terminal';
      tdTerminal.style.cssText = 'color:rgba(255,255,255,0.5);';
      tdTerminal.textContent = TERMINALS[i];

      const tdCheckin = document.createElement('td');
      tdCheckin.className = 'col-checkin';
      tdCheckin.style.cssText = 'color:rgba(255,255,255,0.5);font-size:0.8rem;';
      tdCheckin.textContent = CHECKINS[i];

      const tdCodeshare = document.createElement('td');
      tdCodeshare.className = 'col-codeshare';
      tdCodeshare.style.cssText = 'color:rgba(255,255,255,0.4);font-size:0.82rem;';
      tdCodeshare.textContent = CODESHARES[i];

      tr.append(tdTime, tdDest, tdFlight, tdLogoWrap, tdAirline, tdGate, tdStatus, tdTerminal, tdCheckin, tdCodeshare);
      tbodyEl.appendChild(tr);

      rowCaches.push({
        time: tdTime, dest: tdDest, flight: tdFlight,
        logo: divLogo, airline: tdAirline, gate: tdGate, status: tdStatus,
      });
    }

    table.appendChild(tbodyEl);
    tableContainer.appendChild(table);
    root.appendChild(tableContainer);

    // Save refs
    rows.current = rowCaches;
    tbody.current = tbodyEl;
    header.current = {
      title: h1, langBadge, langList, clock: clockEl, date: dateEl, ths: thElements,
    };
  }, []);

  // ---- Bind JSON data to cached elements (change-only writes) ----
  const bindData = useCallback(() => {
    const cache = rows.current;
    if (cache.length === 0) return;

    const lang = config.current.languages[currentLangIdx.current % config.current.languages.length] || 'ja';

    for (let i = 0; i < flights.current.length && i < cache.length; i++) {
      const f = flights.current[i];
      const c = cache[i];

      // Only write to DOM if value actually differs
      if (c.time.textContent !== f.time) c.time.textContent = f.time;

      const dest = f.destination[lang] || f.destination.en;
      if (c.dest.textContent !== dest) c.dest.textContent = dest;

      if (c.flight.textContent !== f.flightNumber) c.flight.textContent = f.flightNumber;
      
      const newLogoSrc = `https://pics.avs.io/200/200/${f.airlineCode}.png`;
      if (c.logo.getAttribute('src') !== newLogoSrc) {
        c.logo.setAttribute('src', newLogoSrc);
        c.logo.setAttribute('alt', f.airlineCode);
        c.logo.style.background = 'transparent';
      }

      const airlineName = f.airline[lang] || f.airline.en;
      if (c.airline.textContent !== airlineName) c.airline.textContent = airlineName;

      if (c.gate.textContent !== f.gate) c.gate.textContent = f.gate;

      const statusText = f.status[lang] || f.status.en;
      const newStatusClass = `col-status ${getStatusClass(statusText)}`;
      if (c.status.textContent !== statusText) c.status.textContent = statusText;
      if (c.status.className !== newStatusClass) c.status.className = newStatusClass;
    }

    // Headers — only if changed
    const h = header.current;
    if (h) {
      const keys = ['time', 'destination', 'flight', '', 'airline', 'gate', 'status', 'terminal', 'checkin', 'codeshare'] as const;
      for (let i = 0; i < 10; i++) {
        if (i === 3) continue; // logo column — no label
        const k = keys[i];
        const label = (HEADER_LABELS as any)[k]?.[lang] || h.ths[i].textContent;
        if (h.ths[i].textContent !== label) h.ths[i].textContent = label;
      }
      const title = `✈ ${TITLE_LABELS[lang] || TITLE_LABELS.en}`;
      if (h.title.textContent !== title) h.title.textContent = title;
      const badge = lang.toUpperCase();
      if (h.langBadge.textContent !== badge) h.langBadge.textContent = badge;
      const list = config.current.languages.map(l => l.toUpperCase()).join(' / ');
      if (h.langList.textContent !== list) h.langList.textContent = list;
    }
  }, []);

  // ---- Language rotation ----
  const startLangRotation = useCallback(() => {
    if (langTimerRef.current) clearInterval(langTimerRef.current);
    if (config.current.languages.length <= 1) return;

    langTimerRef.current = window.setInterval(() => {
      const tb = tbody.current;
      if (!tb) return;
      tb.style.opacity = '0';
      setTimeout(() => {
        currentLangIdx.current = (currentLangIdx.current + 1) % config.current.languages.length;
        bindData();
        requestAnimationFrame(() => { tb.style.opacity = '1'; });
      }, 400);
    }, (config.current.interval || 5) * 1000);
  }, [bindData]);

  // ---- Single effect: polling + clock + lang rotation ----
  useEffect(() => {
    // Clock (no Preact state, direct DOM)
    const clockTimer = setInterval(() => {
      const h = header.current;
      if (!h) return;
      const now = new Date();
      h.clock.textContent = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      h.date.textContent = now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
    }, 1000);

    // Polling
    let prevConfigKey = '';
    const poll = setInterval(() => {
      fetch('/api/fids/terminal1')
        .then(r => r.json())
        .then(data => {
          const flightsJson = JSON.stringify(data.flights);
          const cfgKey = `${(data.languages || []).join(',')}|${data.interval}`;

          flights.current = data.flights || [];
          config.current = { languages: data.languages || ['ja', 'en'], interval: data.interval || 5 };

          setEmergencyType(data.emergency?.type || null);

          // First load — build everything
          if (!built.current) {
            buildAll();
            bindData();
            startLangRotation();
            prevFlightsJson.current = flightsJson;
            prevConfigKey = cfgKey;
            return;
          }

          // Only touch DOM if data actually changed
          if (flightsJson !== prevFlightsJson.current) {
            prevFlightsJson.current = flightsJson;
            bindData();
          }

          // Only restart timer if config changed
          if (cfgKey !== prevConfigKey) {
            prevConfigKey = cfgKey;
            bindData(); // language labels may have changed
            startLangRotation();
          }
        })
        .catch(() => {});
    }, 3000);

    // Initial fetch
    fetch('/api/fids/terminal1')
      .then(r => r.json())
      .then(data => {
        flights.current = data.flights || [];
        config.current = { languages: data.languages || ['ja', 'en'], interval: data.interval || 5 };
        setEmergencyType(data.emergency?.type || null);
        prevFlightsJson.current = JSON.stringify(data.flights);
        prevConfigKey = `${(data.languages || []).join(',')}|${data.interval}`;
        buildAll();
        bindData();
        startLangRotation();
      })
      .catch(() => {});

    return () => {
      clearInterval(clockTimer);
      clearInterval(poll);
      if (langTimerRef.current) clearInterval(langTimerRef.current);
    };
  }, []);

  // =============================================
  // JSX: only a single <div>. Preact touches nothing else.
  // =============================================
  return (
    <>
      <div ref={rootRef} />
      <EmergencyScreen type={emergencyType} />
    </>
  );
}
