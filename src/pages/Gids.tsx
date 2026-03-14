import { useEffect, useRef, useCallback, useState } from 'preact/hooks';
import { EmergencyScreen, EmergencyType } from '../components/EmergencyScreen';
import { getTailFinSVG } from '../utils/tailFin';

// =============================================
// Types
// =============================================
interface GidsState {
  gateId: string;
  languages: string[];
  interval: number;
  language: string;
  status: string;
  flight: {
    flightNumber: string;
    airline: string;
    airlineCode: string;
    destination: Record<string, string>;
    departureTime: string;
    boardingTime: string;
    gate: string;
    status: Record<string, string>;
  };
}

// =============================================
// Constants
// =============================================
const STATUS_LABELS: Record<string, Record<string, string>> = {
  normal: { ja: '通常案内', en: 'Normal Service', zh: '正常服务', ko: '정상 안내' },
  priority: { ja: '優先搭乗中', en: 'Priority Boarding', zh: '优先登机', ko: '우선 탑승 중' },
  closed: { ja: '搭乗終了', en: 'Boarding Closed', zh: '登机结束', ko: '탑승 종료' },
};

const INFO_LABELS: Record<string, Record<string, string>> = {
  destination: { ja: '行先', en: 'DESTINATION', zh: '目的地', ko: '행선지' },
  flight: { ja: '便名', en: 'FLIGHT', zh: '航班号', ko: '편명' },
  departure: { ja: '出発時刻', en: 'DEPARTURE', zh: '出发时间', ko: '출발 시각' },
  boarding: { ja: '搭乗開始', en: 'BOARDING', zh: '登机时间', ko: '탑승 시작' },
  gate: { ja: 'ゲート', en: 'GATE', zh: '登机口', ko: '게이트' },
  status: { ja: '状態', en: 'STATUS', zh: '状态', ko: '상태' },
};

const TITLE_LABELS: Record<string, string> = {
  ja: '搭乗口案内', en: 'GATE INFORMATION', zh: '登机口信息', ko: '탑승구 안내',
};

const PRIORITY_MESSAGES: Record<string, string[]> = {
  ja: ['優先搭乗のお客様は', 'お進みください'],
  en: ['Priority Passengers', 'Please Proceed to Gate'],
  zh: ['优先登机旅客', '请前往登机口'],
  ko: ['우선 탑승 고객님은', '앞으로 와 주세요'],
};

const CLOSED_MESSAGES: Record<string, string[]> = {
  ja: ['搭乗手続きは', '終了いたしました'],
  en: ['Boarding Has Been', 'Completed'],
  zh: ['登机手续', '已经结束'],
  ko: ['탑승 수속이', '종료되었습니다'],
};

const CLOSED_SUB: Record<string, string> = {
  ja: '次の便の案内をお待ちください',
  en: 'Please wait for the next flight announcement',
  zh: '请等待下一航班的通知',
  ko: '다음 편의 안내를 기다려 주세요',
};

const AIRLINE_COLORS: Record<string, string> = {
  NH: '#003e80', JL: '#c8102e', UA: '#003366', DL: '#003a70',
  CX: '#005e3c', SQ: '#f7c948', KE: '#003a6e', CA: '#d32f2f',
  TG: '#6a1b9a', QF: '#e53935',
};

// =============================================
// DOM element cache for each template
// =============================================
interface NormalCache {
  gateLabel: HTMLElement;
  gateNumber: HTMLElement;
  statusBadge: HTMLElement;
  clock: HTMLElement;
  destLabel: HTMLElement;
  destValue: HTMLElement;
  flightLabel: HTMLElement;
  flightValue: HTMLElement;
  logoEl: HTMLElement;
  departLabel: HTMLElement;
  departValue: HTMLElement;
  boardLabel: HTMLElement;
  boardValue: HTMLElement;
  statusLabel: HTMLElement;
  statusValue: HTMLElement;
}

interface PriorityCache {
  gate: HTMLElement;
  flightBadge: HTMLElement;
  logoEl: HTMLElement;
  destText: HTMLElement;
  clock: HTMLElement;
  badge: HTMLElement;
  msg1: HTMLElement;
  msg2: HTMLElement;
  detailDepartLabel: HTMLElement;
  detailDepartValue: HTMLElement;
  detailBoardLabel: HTMLElement;
  detailBoardValue: HTMLElement;
  detailGateLabel: HTMLElement;
  detailGateValue: HTMLElement;
}

interface ClosedCache {
  gate: HTMLElement;
  flightInfo: HTMLElement;
  clock: HTMLElement;
  badge: HTMLElement;
  msg1: HTMLElement;
  msg2: HTMLElement;
  subtext: HTMLElement;
}

// =============================================
// Helper: set text only if changed
// =============================================
function setText(el: HTMLElement, text: string) {
  if (el.textContent !== text) el.textContent = text;
}
function setClass(el: HTMLElement, cls: string) {
  if (el.className !== cls) el.className = cls;
}

// =============================================
// Component — Preact renders only <div ref>
// =============================================
export function Gids() {
  const rootRef = useRef<HTMLDivElement>(null);
  const built = useRef(false);
  const data = useRef<GidsState | null>(null);
  const prevJson = useRef('');
  const prevConfigKey = useRef('');
  const currentStatus = useRef('');
  const currentLangIdx = useRef(0);
  const langTimerRef = useRef<number | null>(null);

  const [emergencyType, setEmergencyType] = useState<EmergencyType>(null);

  // Template containers (only one visible at a time)
  const normalEl = useRef<HTMLElement | null>(null);
  const priorityEl = useRef<HTMLElement | null>(null);
  const closedEl = useRef<HTMLElement | null>(null);
  const normalCache = useRef<NormalCache | null>(null);
  const priorityCache = useRef<PriorityCache | null>(null);
  const closedCache = useRef<ClosedCache | null>(null);

  // ---- Build all 3 templates once ----
  const buildAll = useCallback(() => {
    const root = rootRef.current;
    if (!root || built.current || !data.current) return;
    built.current = true;
    root.innerHTML = '';

    normalEl.current = buildNormalTemplate();
    priorityEl.current = buildPriorityTemplate();
    closedEl.current = buildClosedTemplate();

    root.append(normalEl.current, priorityEl.current, closedEl.current);

    // Initial: show correct template
    showTemplate(data.current.status);
  }, []);

  // ---- Build Normal Template ----
  function buildNormalTemplate(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'gids-container gids-normal';
    container.style.display = 'none';

    // Header
    const header = document.createElement('div');
    header.className = 'gids-header';

    const headerLeft = document.createElement('div');
    const gateLabel = document.createElement('div');
    gateLabel.className = 'gids-gate-label';
    const gateNumber = document.createElement('div');
    gateNumber.className = 'gids-gate-number';
    headerLeft.append(gateLabel, gateNumber);

    const headerRight = document.createElement('div');
    headerRight.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:8px;';
    const statusBadge = document.createElement('div');
    statusBadge.className = 'gids-status-badge';
    const clock = document.createElement('div');
    clock.style.cssText = 'color:rgba(255,255,255,0.5);font-size:0.85rem;';
    headerRight.append(statusBadge, clock);
    header.append(headerLeft, headerRight);

    // Content
    const content = document.createElement('div');
    content.className = 'gids-content';
    const flightInfo = document.createElement('div');
    flightInfo.className = 'gids-flight-info';

    // Destination card
    const destCard = document.createElement('div');
    destCard.className = 'gids-info-card gids-destination-card';
    const destLabel = document.createElement('div');
    destLabel.className = 'gids-info-label';
    const destValue = document.createElement('div');
    destValue.className = 'gids-info-value';
    destCard.append(destLabel, destValue);

    // Flight card
    const flightCard = document.createElement('div');
    flightCard.className = 'gids-info-card';
    const flightLabel = document.createElement('div');
    flightLabel.className = 'gids-info-label';
    const flightValueDiv = document.createElement('div');
    flightValueDiv.className = 'gids-info-value';
    flightValueDiv.style.cssText = 'display:flex;align-items:center;gap:16px;';
    const logoEl = document.createElement('div');
    logoEl.className = 'airline-logo-container';
    logoEl.style.cssText = 'display:flex;align-items:center;justify-content:center;';
    const flightNumSpan = document.createElement('span');
    flightValueDiv.append(logoEl, flightNumSpan);
    flightCard.append(flightLabel, flightValueDiv);

    // Departure card
    const departCard = document.createElement('div');
    departCard.className = 'gids-info-card';
    const departLabel = document.createElement('div');
    departLabel.className = 'gids-info-label';
    const departValue = document.createElement('div');
    departValue.className = 'gids-info-value';
    departValue.style.fontVariantNumeric = 'tabular-nums';
    departCard.append(departLabel, departValue);

    // Boarding card
    const boardCard = document.createElement('div');
    boardCard.className = 'gids-info-card';
    const boardLabel = document.createElement('div');
    boardLabel.className = 'gids-info-label';
    const boardValue = document.createElement('div');
    boardValue.className = 'gids-info-value';
    boardValue.style.fontVariantNumeric = 'tabular-nums';
    boardCard.append(boardLabel, boardValue);

    // Status card
    const statusCard = document.createElement('div');
    statusCard.className = 'gids-info-card';
    const statusLabel = document.createElement('div');
    statusLabel.className = 'gids-info-label';
    const statusValue = document.createElement('div');
    statusValue.className = 'gids-info-value';
    statusCard.append(statusLabel, statusValue);

    flightInfo.append(destCard, flightCard, departCard, boardCard, statusCard);
    content.appendChild(flightInfo);
    container.append(header, content);

    normalCache.current = {
      gateLabel, gateNumber, statusBadge, clock,
      destLabel, destValue, flightLabel, flightValue: flightNumSpan,
      logoEl, departLabel, departValue, boardLabel, boardValue,
      statusLabel, statusValue,
    };

    return container;
  }

  // ---- Build Priority Template ----
  function buildPriorityTemplate(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'gids-container gids-priority';
    container.style.display = 'none';

    // Top bar
    const topbar = document.createElement('div');
    topbar.className = 'gids-priority-topbar';
    const topLeft = document.createElement('div');
    topLeft.style.cssText = 'display:flex;align-items:center;gap:20px;';
    const gate = document.createElement('div');
    gate.className = 'gids-priority-gate';
    const flightBadge = document.createElement('div');
    flightBadge.className = 'gids-priority-flight-badge';
    const logoEl = document.createElement('div');
    logoEl.className = 'airline-logo-container';
    logoEl.style.cssText = 'display:flex;align-items:center;justify-content:center;';
    const flightSpan = document.createElement('span');
    flightBadge.append(logoEl, flightSpan);
    topLeft.append(gate, flightBadge);

    const topRight = document.createElement('div');
    topRight.style.cssText = 'text-align:right;';
    const destText = document.createElement('div');
    destText.style.cssText = 'font-size:0.8rem;color:rgba(255,255,255,0.5);letter-spacing:0.1em;';
    const clock = document.createElement('div');
    clock.style.cssText = 'font-size:0.8rem;color:rgba(255,255,255,0.4);';
    topRight.append(destText, clock);
    topbar.append(topLeft, topRight);

    // Center
    const center = document.createElement('div');
    center.className = 'gids-priority-center';
    const icon = document.createElement('div');
    icon.className = 'gids-priority-icon';
    icon.textContent = '✈';
    const badge = document.createElement('div');
    badge.className = 'gids-priority-badge-large';
    const msg1 = document.createElement('div');
    msg1.className = 'gids-priority-message-line1';
    const msg2 = document.createElement('div');
    msg2.className = 'gids-priority-message-line2';

    // Detail row
    const detailRow = document.createElement('div');
    detailRow.className = 'gids-priority-detail-row';
    const dLabels = ['departure', 'boarding', 'gate'];
    const detailEls: { label: HTMLElement; value: HTMLElement }[] = [];
    dLabels.forEach((_, idx) => {
      if (idx > 0) {
        const div = document.createElement('div');
        div.className = 'gids-priority-detail-divider';
        detailRow.appendChild(div);
      }
      const item = document.createElement('div');
      item.className = 'gids-priority-detail-item';
      const label = document.createElement('span');
      label.className = 'gids-priority-detail-label';
      const value = document.createElement('span');
      value.className = 'gids-priority-detail-value';
      item.append(label, value);
      detailRow.appendChild(item);
      detailEls.push({ label, value });
    });

    center.append(icon, badge, msg1, msg2, detailRow);
    container.append(topbar, center);

    priorityCache.current = {
      gate, flightBadge: flightSpan, logoEl, destText, clock, badge, msg1, msg2,
      detailDepartLabel: detailEls[0].label, detailDepartValue: detailEls[0].value,
      detailBoardLabel: detailEls[1].label, detailBoardValue: detailEls[1].value,
      detailGateLabel: detailEls[2].label, detailGateValue: detailEls[2].value,
    };

    return container;
  }

  // ---- Build Closed Template ----
  function buildClosedTemplate(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'gids-container gids-closed';
    container.style.display = 'none';

    // Top bar
    const topbar = document.createElement('div');
    topbar.className = 'gids-closed-topbar';
    const topLeft = document.createElement('div');
    topLeft.style.cssText = 'display:flex;align-items:center;gap:20px;';
    const gate = document.createElement('div');
    gate.className = 'gids-closed-gate';
    const flightInfo = document.createElement('div');
    flightInfo.style.cssText = 'color:rgba(255,255,255,0.5);font-size:0.9rem;';
    topLeft.append(gate, flightInfo);
    const clock = document.createElement('div');
    clock.style.cssText = 'font-size:0.8rem;color:rgba(255,255,255,0.4);';
    topbar.append(topLeft, clock);

    // Center
    const center = document.createElement('div');
    center.className = 'gids-closed-center';
    const iconWrap = document.createElement('div');
    iconWrap.className = 'gids-closed-icon';
    iconWrap.textContent = '✕';
    const badge = document.createElement('div');
    badge.className = 'gids-closed-badge-large';
    const msg1 = document.createElement('div');
    msg1.className = 'gids-closed-message-line1';
    const msg2 = document.createElement('div');
    msg2.className = 'gids-closed-message-line2';
    const subtext = document.createElement('div');
    subtext.className = 'gids-closed-subtext';
    center.append(iconWrap, badge, msg1, msg2, subtext);
    container.append(topbar, center);

    closedCache.current = { gate, flightInfo, clock, badge, msg1, msg2, subtext };

    return container;
  }

  // ---- Show/hide templates ----
  const showTemplate = useCallback((status: string) => {
    const n = normalEl.current;
    const p = priorityEl.current;
    const c = closedEl.current;
    if (!n || !p || !c) return;

    n.style.display = status === 'normal' ? 'flex' : 'none';
    p.style.display = status === 'priority' ? 'flex' : 'none';
    c.style.display = status === 'closed' ? 'flex' : 'none';
    currentStatus.current = status;
  }, []);

  // ---- Bind data to all templates ----
  const bindData = useCallback(() => {
    const d = data.current;
    if (!d) return;

    const langs = d.languages || [d.language || 'ja'];
    const lang = langs[currentLangIdx.current % langs.length] || 'ja';
    const f = d.flight;
    const timeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

    // Normal
    const nc = normalCache.current;
    if (nc) {
      setText(nc.gateLabel, TITLE_LABELS[lang] || TITLE_LABELS.en);
      setText(nc.gateNumber, d.gateId);
      setText(nc.statusBadge, STATUS_LABELS.normal[lang]);
      setText(nc.clock, timeStr);
      setText(nc.destLabel, INFO_LABELS.destination[lang]);
      setText(nc.destValue, f.destination[lang] || f.destination.en);
      setText(nc.flightLabel, INFO_LABELS.flight[lang]);
      setText(nc.flightValue, f.flightNumber);
      
      const newLogoHTML = getTailFinSVG(f.airlineCode, 48);
      if (nc.logoEl.innerHTML !== newLogoHTML) {
        nc.logoEl.innerHTML = newLogoHTML;
      }
      
      setText(nc.departLabel, INFO_LABELS.departure[lang]);
      setText(nc.departValue, f.departureTime);
      setText(nc.boardLabel, INFO_LABELS.boarding[lang]);
      setText(nc.boardValue, f.boardingTime);
      setText(nc.statusLabel, INFO_LABELS.status[lang]);
      setText(nc.statusValue, f.status[lang] || f.status.en);
    }

    // Priority
    const pc = priorityCache.current;
    if (pc) {
      setText(pc.gate, d.gateId);
      setText(pc.flightBadge, f.flightNumber);
      
      const newLogoHTML = getTailFinSVG(f.airlineCode, 36);
      if (pc.logoEl.innerHTML !== newLogoHTML) {
        pc.logoEl.innerHTML = newLogoHTML;
      }
      
      setText(pc.destText, f.destination[lang] || f.destination.en);
      setText(pc.clock, timeStr);
      setText(pc.badge, STATUS_LABELS.priority[lang]);
      const pm = PRIORITY_MESSAGES[lang] || PRIORITY_MESSAGES.en;
      setText(pc.msg1, pm[0]);
      setText(pc.msg2, pm[1]);
      setText(pc.detailDepartLabel, INFO_LABELS.departure[lang]);
      setText(pc.detailDepartValue, f.departureTime);
      setText(pc.detailBoardLabel, INFO_LABELS.boarding[lang]);
      setText(pc.detailBoardValue, f.boardingTime);
      setText(pc.detailGateLabel, INFO_LABELS.gate[lang]);
      setText(pc.detailGateValue, d.gateId);
    }

    // Closed
    const cc = closedCache.current;
    if (cc) {
      setText(cc.gate, d.gateId);
      setText(cc.flightInfo, `${f.flightNumber} → ${f.destination[lang] || f.destination.en}`);
      setText(cc.clock, timeStr);
      setText(cc.badge, STATUS_LABELS.closed[lang]);
      const cm = CLOSED_MESSAGES[lang] || CLOSED_MESSAGES.en;
      setText(cc.msg1, cm[0]);
      setText(cc.msg2, cm[1]);
      setText(cc.subtext, CLOSED_SUB[lang] || CLOSED_SUB.en);
    }
  }, []);

  // ---- Language rotation ----
  const startLangRotation = useCallback(() => {
    if (langTimerRef.current) clearInterval(langTimerRef.current);
    const d = data.current;
    if (!d) return;
    const langs = d.languages || [d.language || 'ja'];
    if (langs.length <= 1) return;

    const interval = (d.interval || 5) * 1000;
    langTimerRef.current = window.setInterval(() => {
      // Always read latest data for language count
      const latest = data.current;
      if (!latest) return;
      const currentLangs = latest.languages || [latest.language || 'ja'];
      if (currentLangs.length <= 1) return;
      currentLangIdx.current = (currentLangIdx.current + 1) % currentLangs.length;
      bindData();
    }, interval);
  }, [bindData]);

  // ---- Single effect: polling, clock, lang rotation ----
  useEffect(() => {
    let prevDataJson = '';
    let prevCfgKey = '';

    // Clock update
    const clockTimer = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      if (normalCache.current) setText(normalCache.current.clock, timeStr);
      if (priorityCache.current) setText(priorityCache.current.clock, timeStr);
      if (closedCache.current) setText(closedCache.current.clock, timeStr);
    }, 1000);

    const handleData = (raw: GidsState) => {
      data.current = raw;
      const dataJson = JSON.stringify(raw.flight) + raw.status;
      const cfgKey = `${(raw.languages || []).join(',')}|${raw.interval}`;

      // @ts-ignore
      setEmergencyType(raw.emergency?.type || null);

      if (!built.current) {
        buildAll();
        bindData();
        startLangRotation();
        prevDataJson = dataJson;
        prevCfgKey = cfgKey;
        return;
      }

      // Status changed → switch template
      if (raw.status !== currentStatus.current) {
        showTemplate(raw.status);
      }

      // Data changed → rebind
      if (dataJson !== prevDataJson) {
        prevDataJson = dataJson;
        bindData();
      }

      // Config changed → restart rotation
      if (cfgKey !== prevCfgKey) {
        prevCfgKey = cfgKey;
        bindData();
        startLangRotation();
      }
    };

    // Initial fetch
    fetch('/api/gids/gate11')
      .then(r => r.json())
      .then(handleData)
      .catch(() => {});

    // Polling
    const poll = setInterval(() => {
      fetch('/api/gids/gate11')
        .then(r => r.json())
        .then(handleData)
        .catch(() => {});
    }, 2500);

    return () => {
      clearInterval(clockTimer);
      clearInterval(poll);
      if (langTimerRef.current) clearInterval(langTimerRef.current);
    };
  }, []);

  // Preact renders only this single div — everything else is pure DOM
  return (
    <>
      <div ref={rootRef} style={{ width: '100vw', height: '100vh' }} />
      <EmergencyScreen type={emergencyType} />
    </>
  );
}
