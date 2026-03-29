import { useState, useEffect, useCallback } from 'preact/hooks';
import { getTailFinSVG } from '../utils/tailFin';

const LANG_LABELS: Record<string, string> = {
  ja: '日本語',
  en: 'English',
  zh: '中文',
  ko: '한국어',
};

interface Flight {
  id: number;
  time: string;
  flightNumber: string;
  airlineCode: string;
  airline: Record<string, string>;
  destination: Record<string, string>;
  gate: string;
  status: Record<string, string>;
}

const STATUS_OPTIONS = [
  { key: 'ontime', label: '定刻' },
  { key: 'boarding', label: '搭乗中' },
  { key: 'nowboarding', label: '搭乗案内' },
  { key: 'delayed', label: '遅延' },
  { key: 'departed', label: '出発済' },
  { key: 'cancelled', label: '欠航' },
  { key: 'gatechanged', label: 'ゲート変更' },
];

const GATE_OPTIONS = ['G01', 'G02', 'G03', 'G05', 'G07', 'G08', 'G11', 'G12', 'G15', 'G18', 'G20', 'G21', 'G22', 'G25', 'G28', 'G30', 'G31', 'G33'];

function getStatusKey(status: Record<string, string>): string {
  const ja = status.ja || '';
  if (ja === '定刻') return 'ontime';
  if (ja === '搭乗中') return 'boarding';
  if (ja === '搭乗案内') return 'nowboarding';
  if (ja === '遅延') return 'delayed';
  if (ja === '出発済') return 'departed';
  if (ja === '欠航') return 'cancelled';
  if (ja === 'ゲート変更') return 'gatechanged';
  return 'ontime';
}

export function Admin() {
  const [fidsLangs, setFidsLangs] = useState<string[]>(['ja', 'en']);
  const [fidsInterval, setFidsInterval] = useState(5);
  const [fidsTemplateType, setFidsTemplateType] = useState<'json' | 'html'>('json');
  const [fidsTemplateUrl, setFidsTemplateUrl] = useState('');
  // Style settings
  const [fidsColumns, setFidsColumns] = useState<string[]>(['time', 'destination', 'flight', 'logo', 'airline', 'gate', 'status', 'terminal', 'checkin', 'codeshare']);
  const [fidsFontSize, setFidsFontSize] = useState<string>('M');
  const [fidsTheme, setFidsTheme] = useState<string>('dark');
  const [fidsMaxRows, setFidsMaxRows] = useState<number>(0);
  const [fidsHeaderTitle, setFidsHeaderTitle] = useState<string>('');
  const [gidsStatus, setGidsStatus] = useState('normal');
  const [gidsLangs, setGidsLangs] = useState<string[]>(['ja', 'en']);
  const [gidsInterval, setGidsInterval] = useState(5);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [editingFlight, setEditingFlight] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingGids, setSavingGids] = useState(false);
  const [emergencyType, setEmergencyType] = useState<string | null>(null);

  // Fetch current state on mount, and poll for auto-updates
  useEffect(() => {
    const fetchState = () => {
      fetch('/api/state')
        .then((r) => r.json())
        .then((data) => {
          setFidsLangs(data.fids.languages || ['ja', 'en']);
          setFidsInterval(data.fids.interval || 5);
          const tpl = data.fids.template || { type: 'json' };
          setFidsTemplateType(tpl.type || 'json');
          setFidsTemplateUrl(tpl.url || '');
          const st = data.fids.style || {};
          setFidsColumns(st.columns || ['time', 'destination', 'flight', 'logo', 'airline', 'gate', 'status', 'terminal', 'checkin', 'codeshare']);
          setFidsFontSize(st.fontSize || 'M');
          setFidsTheme(st.theme || 'dark');
          setFidsMaxRows(st.maxRows || 0);
          setFidsHeaderTitle(st.headerTitle || '');
          setGidsStatus(data.gids.status || 'normal');
          setGidsLangs(data.gids.languages || [data.gids.language || 'ja']);
          setGidsInterval(data.gids.interval || 5);
          setFlights(data.fids.flights || []);
          setEmergencyType(data.emergency?.type || null);
        })
        .catch(() => {});
    };
    fetchState();
    // Poll every 5 seconds to reflect auto-updates
    const poll = setInterval(fetchState, 5000);
    return () => clearInterval(poll);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const copyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    showToast('✅ URLをクリップボードにコピーしました');
  }, [showToast]);

  const toggleLang = useCallback((lang: string) => {
    setFidsLangs((prev) => {
      const next = prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang];
      return next.length === 0 ? [lang] : next;
    });
  }, []);

  const saveFids = useCallback(async () => {
    setSaving(true);
    const template = fidsTemplateType === 'html'
      ? { type: 'html', url: fidsTemplateUrl }
      : { type: 'json' };
    const style = {
      columns: fidsColumns,
      fontSize: fidsFontSize,
      theme: fidsTheme,
      maxRows: fidsMaxRows,
      headerTitle: fidsHeaderTitle,
    };
    await fetch('/api/fids/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ languages: fidsLangs, interval: fidsInterval, template, style }),
    });
    setSaving(false);
    showToast('✅ FIDS設定を更新しました');
  }, [fidsLangs, fidsInterval, fidsTemplateType, fidsTemplateUrl, fidsColumns, fidsFontSize, fidsTheme, fidsMaxRows, fidsHeaderTitle, showToast]);

  const toggleFidsColumn = useCallback((col: string) => {
    setFidsColumns((prev) => {
      if (prev.includes(col)) {
        const next = prev.filter(c => c !== col);
        return next.length === 0 ? [col] : next;
      }
      return [...prev, col];
    });
  }, []);

  const toggleGidsLang = useCallback((lang: string) => {
    setGidsLangs((prev) => {
      const next = prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang];
      return next.length === 0 ? [lang] : next;
    });
  }, []);

  const saveGidsConfig = useCallback(async () => {
    setSavingGids(true);
    await fetch('/api/gids/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ languages: gidsLangs, interval: gidsInterval }),
    });
    setSavingGids(false);
    showToast('✅ GIDS設定を更新しました');
  }, [gidsLangs, gidsInterval, showToast]);

  const saveGidsStatus = useCallback(async (status: string) => {
    setGidsStatus(status);
    await fetch('/api/gids/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    showToast('✅ GIDSステータスを更新しました');
  }, [showToast]);

  const saveEmergency = useCallback(async (type: string | null) => {
    setEmergencyType(type);
    await fetch('/api/emergency/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    showToast(`✅ 緊急ステータスを更新しました (${type || '通常'})`);
  }, [showToast]);

  const updateFlight = useCallback(async (id: number, updates: any) => {
    await fetch('/api/fids/flight/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    // Refresh flights
    const res = await fetch('/api/state');
    const data = await res.json();
    setFlights(data.fids.flights || []);
    showToast('✅ 便情報を更新しました');
    setEditingFlight(null);
  }, [showToast]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div class="admin-container">
      <div class="admin-header">
        <h1>✈ FIDS / GIDS 管理コンソール</h1>
        <p>フライト情報表示システム — 配信制御パネル</p>
      </div>

      <div class="admin-grid">

        {/* Emergency Controls (Full Width) */}
        <div class="admin-card" style="grid-column: 1 / -1; border-color: #ef4444; background: rgba(239, 68, 68, 0.05);">
          <h2><span class="icon">🚨</span>緊急時コントロール (Emergency Controls)</h2>
          <div class="admin-section">
            <p style="color:rgba(255,255,255,0.7); margin-bottom: 12px; font-size: 0.9rem;">
              緊急ボタンを押すと、すべてのFIDSおよびGIDS端末が直ちに固定の避難誘導画面に切り替わります。
            </p>
            <div class="admin-status-group">
              <button
                class={`admin-status-btn ${emergencyType === 'fire' ? 'active' : ''}`}
                style={emergencyType === 'fire' ? 'background: #ef4444; color: white;' : 'color: #ef4444; border-color: #ef4444;'}
                onClick={() => saveEmergency('fire')}
              >
                🔥 火災 (Fire)
              </button>
              <button
                class={`admin-status-btn ${emergencyType === 'earthquake' ? 'active' : ''}`}
                style={emergencyType === 'earthquake' ? 'background: #f97316; color: white;' : 'color: #f97316; border-color: #f97316;'}
                onClick={() => saveEmergency('earthquake')}
              >
                🌋 地震 (Earthquake)
              </button>
              <button
                class={`admin-status-btn ${emergencyType === null ? 'active' : ''}`}
                style={emergencyType === null ? 'background: rgba(255,255,255,0.2); color: white;' : 'color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.3);'}
                onClick={() => saveEmergency(null)}
              >
                ✅ 通常に戻す (Reset)
              </button>
            </div>
          </div>
        </div>

        {/* FIDS Controls */}
        <div class="admin-card">
          <h2><span class="icon">🖥</span>FIDS（フライト情報画面）配信制御</h2>

          <div class="admin-section">
            <label>STB表示用URI</label>
            <div class="admin-url-row">
              <div class="admin-url-text">{baseUrl}/fids/terminal1</div>
              <button class="admin-btn admin-btn-copy" onClick={() => copyUrl(`${baseUrl}/fids/terminal1`)}>📋 コピー</button>
            </div>
          </div>

          <div class="admin-section">
            <label>表示言語の選択</label>
            <div class="admin-checkbox-group">
              {['ja', 'en', 'zh', 'ko'].map((lang) => (
                <div
                  key={lang}
                  class={`admin-checkbox-item ${fidsLangs.includes(lang) ? 'active' : ''}`}
                  onClick={() => toggleLang(lang)}
                >
                  <span>{LANG_LABELS[lang]}</span>
                </div>
              ))}
            </div>
          </div>

          <div class="admin-section">
            <label>言語切り替えインターバル（秒）</label>
            <select
              class="admin-select"
              value={fidsInterval}
              onChange={(e) => setFidsInterval(Number((e.target as HTMLSelectElement).value))}
            >
              <option value={3}>3秒</option>
              <option value={5}>5秒</option>
              <option value={10}>10秒</option>
              <option value={15}>15秒</option>
              <option value={30}>30秒</option>
            </select>
          </div>

          <div class="admin-section">
            <label>テンプレートの選択</label>
            <select
              class="admin-select"
              value={
                fidsTemplateType === 'json' ? 'json'
                : fidsTemplateUrl === '/samples/welcome.html' ? 'welcome'
                : fidsTemplateUrl === '/samples/weather.html' ? 'weather'
                : fidsTemplateUrl === '/samples/ad.html' ? 'ad'
                : 'custom'
              }
              onChange={(e) => {
                const v = (e.target as HTMLSelectElement).value;
                if (v === 'json') {
                  setFidsTemplateType('json');
                  setFidsTemplateUrl('');
                } else if (v === 'custom') {
                  setFidsTemplateType('html');
                  setFidsTemplateUrl('');
                } else {
                  setFidsTemplateType('html');
                  const urlMap: Record<string, string> = {
                    welcome: '/samples/welcome.html',
                    weather: '/samples/weather.html',
                    ad: '/samples/ad.html',
                  };
                  setFidsTemplateUrl(urlMap[v] || '');
                }
              }}
            >
              <option value="json">📊 標準テーブル（JSON）</option>
              <option value="welcome">✈ ウェルカム画面</option>
              <option value="weather">🌤 インフォメーション（天気・交通・為替）</option>
              <option value="ad">🛍 広告（免税店・ラウンジ・セキュリティ）</option>
              <option value="custom">🔗 カスタムURL</option>
            </select>
            {fidsTemplateType === 'html' && !(['/samples/welcome.html', '/samples/weather.html', '/samples/ad.html'].includes(fidsTemplateUrl)) && (
              <div style="margin-top: 10px;">
                <label>外部HTML URL</label>
                <input
                  class="admin-input"
                  type="url"
                  placeholder="https://example.com/fids-display.html"
                  value={fidsTemplateUrl}
                  onInput={(e) => setFidsTemplateUrl((e.target as HTMLInputElement).value)}
                  style="width: 100%; padding: 10px; font-size: 0.9rem;"
                />
              </div>
            )}
          </div>

          {fidsTemplateType === 'json' && (
            <>
              <div class="admin-section">
                <label>表示列の選択</label>
                <div class="admin-checkbox-group" style="flex-wrap:wrap;">
                  {[
                    { key: 'time', label: '時刻' },
                    { key: 'destination', label: '行先' },
                    { key: 'flight', label: '便名' },
                    { key: 'logo', label: 'ロゴ' },
                    { key: 'airline', label: '航空会社' },
                    { key: 'gate', label: 'ゲート' },
                    { key: 'status', label: '備考' },
                    { key: 'terminal', label: 'ターミナル' },
                    { key: 'checkin', label: 'チェックイン' },
                    { key: 'codeshare', label: '共同運航' },
                  ].map((col) => (
                    <div
                      key={col.key}
                      class={`admin-checkbox-item ${fidsColumns.includes(col.key) ? 'active' : ''}`}
                      onClick={() => toggleFidsColumn(col.key)}
                    >
                      <span>{col.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div class="admin-section">
                <label>カラーテーマ</label>
                <div class="admin-status-group">
                  <button
                    class={`admin-status-btn ${fidsTheme === 'dark' ? 'active' : ''}`}
                    onClick={() => setFidsTheme('dark')}
                    style={fidsTheme === 'dark' ? 'background:rgba(255,255,255,0.15);' : ''}
                  >🌑 ダーク</button>
                  <button
                    class={`admin-status-btn ${fidsTheme === 'blue' ? 'active' : ''}`}
                    onClick={() => setFidsTheme('blue')}
                    style={fidsTheme === 'blue' ? 'background:rgba(96,165,250,0.2); color:#60a5fa;' : 'color:#60a5fa; border-color:#60a5fa;'}
                  >🔵 ブルー</button>
                  <button
                    class={`admin-status-btn ${fidsTheme === 'green' ? 'active' : ''}`}
                    onClick={() => setFidsTheme('green')}
                    style={fidsTheme === 'green' ? 'background:rgba(74,222,128,0.2); color:#4ade80;' : 'color:#4ade80; border-color:#4ade80;'}
                  >🟢 グリーン</button>
                </div>
              </div>

              <div class="admin-section" style="display:flex; gap:1.5rem; flex-wrap:wrap;">
                <div style="flex:1; min-width:140px;">
                  <label>フォントサイズ</label>
                  <select class="admin-select" value={fidsFontSize} onChange={(e) => setFidsFontSize((e.target as HTMLSelectElement).value)}>
                    <option value="S">S（小）</option>
                    <option value="M">M（中）</option>
                    <option value="L">L（大）</option>
                  </select>
                </div>
                <div style="flex:1; min-width:140px;">
                  <label>表示便数</label>
                  <select class="admin-select" value={fidsMaxRows} onChange={(e) => setFidsMaxRows(Number((e.target as HTMLSelectElement).value))}>
                    <option value={0}>全件表示</option>
                    <option value={10}>10便</option>
                    <option value={15}>15便</option>
                    <option value={18}>18便</option>
                  </select>
                </div>
              </div>

              <div class="admin-section">
                <label>ヘッダータイトル（空欄 = デフォルト「出発便案内」）</label>
                <input
                  class="admin-input"
                  type="text"
                  placeholder="例: ✈ 日本国際空港 出発便案内"
                  value={fidsHeaderTitle}
                  onInput={(e) => setFidsHeaderTitle((e.target as HTMLInputElement).value)}
                  style="width: 100%; padding: 10px; font-size: 0.9rem;"
                />
              </div>
            </>
          )}

          <button class="admin-btn admin-btn-primary" onClick={saveFids} disabled={saving}>
            {saving ? '保存中...' : '💾 設定を保存'}
          </button>
        </div>

        {/* GIDS Controls */}
        <div class="admin-card">
          <h2><span class="icon">🚪</span>GIDS（ゲート情報画面）配信制御</h2>

          <div class="admin-section">
            <label>STB表示用URI</label>
            <div class="admin-url-row">
              <div class="admin-url-text">{baseUrl}/gids/gate11</div>
              <button class="admin-btn admin-btn-copy" onClick={() => copyUrl(`${baseUrl}/gids/gate11`)}>📋 コピー</button>
            </div>
          </div>

          <div class="admin-section">
            <label>画面ステータスの切り替え</label>
            <div class="admin-status-group">
              <button
                class={`admin-status-btn normal ${gidsStatus === 'normal' ? 'active' : ''}`}
                onClick={() => saveGidsStatus('normal')}
              >
                通常案内
              </button>
              <button
                class={`admin-status-btn priority ${gidsStatus === 'priority' ? 'active' : ''}`}
                onClick={() => saveGidsStatus('priority')}
              >
                優先搭乗中
              </button>
              <button
                class={`admin-status-btn closed ${gidsStatus === 'closed' ? 'active' : ''}`}
                onClick={() => saveGidsStatus('closed')}
              >
                搭乗終了
              </button>
            </div>
          </div>

          <div class="admin-section">
            <label>表示言語の選択（ローテーション）</label>
            <div class="admin-checkbox-group">
              {['ja', 'en', 'zh', 'ko'].map((lang) => (
                <div
                  key={lang}
                  class={`admin-checkbox-item ${gidsLangs.includes(lang) ? 'active' : ''}`}
                  onClick={() => toggleGidsLang(lang)}
                >
                  <span>{LANG_LABELS[lang]}</span>
                </div>
              ))}
            </div>
          </div>

          <div class="admin-section">
            <label>言語切り替えインターバル（秒）</label>
            <select
              class="admin-select"
              value={gidsInterval}
              onChange={(e) => setGidsInterval(Number((e.target as HTMLSelectElement).value))}
            >
              <option value={3}>3秒</option>
              <option value={5}>5秒</option>
              <option value={10}>10秒</option>
              <option value={15}>15秒</option>
              <option value={30}>30秒</option>
            </select>
          </div>

          <button class="admin-btn admin-btn-primary" onClick={saveGidsConfig} disabled={savingGids}>
            {savingGids ? '保存中...' : '💾 設定を保存'}
          </button>
        </div>

        {/* Flight Edit Table */}
        <div class="admin-card" style="grid-column: 1 / -1;">
          <h2><span class="icon">✈</span>便情報の管理<span style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-left:12px;">🔄 30秒ごとに自動更新</span></h2>
          <div style="overflow-x:auto;">
            <table class="admin-flight-table">
              <thead>
                <tr>
                  <th>時刻</th>
                  <th>便名</th>
                  <th>行先（日本語）</th>
                  <th>航空会社</th>
                  <th>ゲート</th>
                  <th>ステータス</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {flights.map((f) => (
                  <tr key={f.id} class={editingFlight === f.id ? 'editing-row' : ''}>
                    {editingFlight === f.id ? (
                      <FlightEditRow
                        flight={f}
                        onSave={(updates) => updateFlight(f.id, updates)}
                        onCancel={() => setEditingFlight(null)}
                      />
                    ) : (
                      <>
                        <td style="font-weight:700;color:#fbbf24;">{f.time}</td>
                        <td style="font-weight:600;">{f.flightNumber}</td>
                        <td>{f.destination?.ja}</td>
                        <td>
                          <span style="display:inline-flex;align-items:center;gap:8px;">
                            <div dangerouslySetInnerHTML={{ __html: getTailFinSVG(f.airlineCode, 24) }} />
                            {f.airline?.ja}
                          </span>
                        </td>
                        <td style="font-weight:600;">{f.gate}</td>
                        <td>
                          <span class={`admin-flight-status ${getStatusClassName(f.status)}`}>{f.status?.ja}</span>
                        </td>
                        <td>
                          <button
                            class="admin-btn admin-btn-edit"
                            onClick={() => setEditingFlight(f.id)}
                          >
                            ✏️ 編集
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructions */}
        <div class="admin-card" style="grid-column: 1 / -1;">
          <h2><span class="icon">📖</span>使用方法</h2>
          <div style="color: rgba(255,255,255,0.6); line-height: 1.8; font-size: 0.9rem;">
            <p><strong>1.</strong> 上記のSTB表示用URIの「コピー」ボタンをクリックし、URLをクリップボードにコピーします。</p>
            <p><strong>2.</strong> 別のブラウザウィンドウ（またはシークレットウィンドウ）でURLを開くと、サイネージ表示が起動します。</p>
            <p><strong>3.</strong> この管理画面で設定を変更すると、5秒以内にサイネージ画面へ反映されます。</p>
            <p style="margin-top:12px;"><strong style="color:#fbbf24;">💡 FIDS:</strong> 複数の言語を選択すると、設定したインターバルで自動的に切り替わります。便情報は下の表から個別に編集可能です。</p>
            <p><strong style="color:#fb923c;">💡 GIDS:</strong> ステータスボタンを押すとゲート画面の<strong>テンプレート自体が差し替わり</strong>、レイアウトが変更されます。</p>
            <p><strong style="color:#a78bfa;">💡 自動更新:</strong> サーバーが30秒ごとに1〜3便のフライト情報を自動更新し、リアルタイムな運行変更をシミュレートします。</p>
          </div>
        </div>
      </div>

      {toast && <div class="toast">{toast}</div>}
    </div>
  );
}

// === Flight Edit Row Component ===
function FlightEditRow({ flight, onSave, onCancel }: {
  flight: Flight;
  onSave: (updates: any) => void;
  onCancel: () => void;
}) {
  const [time, setTime] = useState(flight.time);
  const [flightNum, setFlightNum] = useState(flight.flightNumber);
  const [gate, setGate] = useState(flight.gate);
  const [statusKey, setStatusKey] = useState(getStatusKey(flight.status));

  return (
    <>
      <td>
        <input
          class="admin-input"
          style="width:80px;"
          type="text"
          value={time}
          onChange={(e) => setTime((e.target as HTMLInputElement).value)}
        />
      </td>
      <td>
        <input
          class="admin-input"
          style="width:100px;"
          type="text"
          value={flightNum}
          onChange={(e) => setFlightNum((e.target as HTMLInputElement).value)}
        />
      </td>
      <td style="color:rgba(255,255,255,0.4);font-size:0.8rem;">{flight.destination?.ja}</td>
      <td style="color:rgba(255,255,255,0.4);font-size:0.8rem;">
        <span style="display:inline-flex;align-items:center;gap:6px;">
          <div dangerouslySetInnerHTML={{ __html: getTailFinSVG(flight.airlineCode, 20) }} />
          {flight.airline?.ja}
        </span>
      </td>
      <td>
        <select class="admin-select" style="width:80px;" value={gate} onChange={(e) => setGate((e.target as HTMLSelectElement).value)}>
          {GATE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </td>
      <td>
        <select class="admin-select" style="width:110px;" value={statusKey} onChange={(e) => setStatusKey((e.target as HTMLSelectElement).value)}>
          {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </td>
      <td style="display:flex;gap:4px;">
        <button class="admin-btn admin-btn-save" onClick={() => onSave({ time, flightNumber: flightNum, gate, statusKey })}>
          💾
        </button>
        <button class="admin-btn admin-btn-cancel" onClick={onCancel}>
          ✕
        </button>
      </td>
    </>
  );
}

// Utility
function getAirlineColor(code: string): string {
  const colors: Record<string, string> = {
    NH: '#003e80', JL: '#c8102e', UA: '#003366', DL: '#003a70',
    CX: '#005e3c', SQ: '#f7c948', KE: '#003a6e', CA: '#d32f2f',
    TG: '#6a1b9a', QF: '#e53935',
  };
  return colors[code] || '#6366f1';
}

function getStatusClassName(status: Record<string, string>): string {
  const ja = status?.ja || '';
  if (ja === '定刻') return 'st-ontime';
  if (ja === '搭乗中' || ja === '搭乗案内') return 'st-boarding';
  if (ja === '遅延') return 'st-delayed';
  if (ja === '出発済') return 'st-departed';
  if (ja === '欠航') return 'st-cancelled';
  if (ja === 'ゲート変更') return 'st-gatechanged';
  return '';
}
