import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data', 'state.json');

// === Data file management ===
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const initialState = getInitialState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialState, null, 2));
  }
}

function getInitialState() {
  return {
    fids: {
      languages: ['ja', 'en'],
      interval: 5,
      flights: generateFlights(),
    },
    gids: {
      gateId: 'G11',
      languages: ['ja', 'en'],
      interval: 5,
      language: 'ja',
      status: 'normal',
      flight: {
        flightNumber: 'NH 857',
        airline: 'ANA',
        airlineCode: 'NH',
        destination: { ja: '上海 / 浦東', en: 'Shanghai / Pudong', zh: '上海浦东', ko: '상하이 / 푸동' },
        departureTime: '14:30',
        boardingTime: '14:00',
        gate: 'G11',
        status: { ja: '定刻', en: 'On Time', zh: '准时', ko: '정시' },
      },
    },
  };
}

function generateFlights() {
  const airlines = [
    { code: 'NH', name: { ja: '全日空', en: 'All Nippon Airways', zh: '全日空', ko: '전일본공수' } },
    { code: 'JL', name: { ja: '日本航空', en: 'Japan Airlines', zh: '日本航空', ko: '일본항공' } },
    { code: 'UA', name: { ja: 'ユナイテッド航空', en: 'United Airlines', zh: '美联航', ko: '유나이티드항공' } },
    { code: 'DL', name: { ja: 'デルタ航空', en: 'Delta Air Lines', zh: '达美航空', ko: '델타항공' } },
    { code: 'CX', name: { ja: 'キャセイパシフィック', en: 'Cathay Pacific', zh: '国泰航空', ko: '캐세이퍼시픽' } },
    { code: 'SQ', name: { ja: 'シンガポール航空', en: 'Singapore Airlines', zh: '新加坡航空', ko: '싱가포르항공' } },
    { code: 'KE', name: { ja: '大韓航空', en: 'Korean Air', zh: '大韩航空', ko: '대한항공' } },
    { code: 'CA', name: { ja: '中国国際航空', en: 'Air China', zh: '中国国际航空', ko: '중국국제항공' } },
    { code: 'TG', name: { ja: 'タイ国際航空', en: 'Thai Airways', zh: '泰国国际航空', ko: '타이항공' } },
    { code: 'QF', name: { ja: 'カンタス航空', en: 'Qantas', zh: '澳洲航空', ko: '콴타스항공' } },
  ];

  const destinations = [
    { ja: 'ロサンゼルス', en: 'Los Angeles', zh: '洛杉矶', ko: '로스앤젤레스' },
    { ja: 'ロンドン / ヒースロー', en: 'London / Heathrow', zh: '伦敦希思罗', ko: '런던 / 히드로' },
    { ja: 'ソウル / 仁川', en: 'Seoul / Incheon', zh: '首尔仁川', ko: '서울 / 인천' },
    { ja: '上海 / 浦東', en: 'Shanghai / Pudong', zh: '上海浦东', ko: '상하이 / 푸동' },
    { ja: '北京 / 首都', en: 'Beijing / Capital', zh: '北京首都', ko: '베이징 / 수도' },
    { ja: 'シンガポール', en: 'Singapore', zh: '新加坡', ko: '싱가포르' },
    { ja: 'バンコク', en: 'Bangkok', zh: '曼谷', ko: '방콕' },
    { ja: 'シドニー', en: 'Sydney', zh: '悉尼', ko: '시드니' },
    { ja: 'ニューヨーク / JFK', en: 'New York / JFK', zh: '纽约肯尼迪', ko: '뉴욕 / JFK' },
    { ja: 'パリ / CDG', en: 'Paris / CDG', zh: '巴黎戴高乐', ko: '파리 / CDG' },
    { ja: 'フランクフルト', en: 'Frankfurt', zh: '法兰克福', ko: '프랑크푸르트' },
    { ja: 'ホノルル', en: 'Honolulu', zh: '檀香山', ko: '호놀룰루' },
    { ja: '台北 / 桃園', en: 'Taipei / Taoyuan', zh: '台北桃园', ko: '타이베이 / 타오위안' },
    { ja: 'マニラ', en: 'Manila', zh: '马尼拉', ko: '마닐라' },
    { ja: 'ジャカルタ', en: 'Jakarta', zh: '雅加达', ko: '자카르타' },
    { ja: 'デリー', en: 'Delhi', zh: '德里', ko: '델리' },
    { ja: 'ドバイ', en: 'Dubai', zh: '迪拜', ko: '두바이' },
    { ja: 'サンフランシスコ', en: 'San Francisco', zh: '旧金山', ko: '샌프란시스코' },
  ];

  const statuses = [
    { ja: '定刻', en: 'On Time', zh: '准时', ko: '정시' },
    { ja: '定刻', en: 'On Time', zh: '准时', ko: '정시' },
    { ja: '定刻', en: 'On Time', zh: '准时', ko: '정시' },
    { ja: '搭乗中', en: 'Boarding', zh: '登机中', ko: '탑승 중' },
    { ja: '遅延', en: 'Delayed', zh: '延误', ko: '지연' },
    { ja: '出発済', en: 'Departed', zh: '已起飞', ko: '출발' },
    { ja: '搭乗案内', en: 'Now Boarding', zh: '即将登机', ko: '탑승 안내' },
    { ja: '欠航', en: 'Cancelled', zh: '取消', ko: '결항' },
  ];

  const gates = ['G01', 'G02', 'G03', 'G05', 'G07', 'G08', 'G11', 'G12', 'G15', 'G18', 'G20', 'G21', 'G22', 'G25', 'G28', 'G30', 'G31', 'G33'];

  const flights = [];
  for (let i = 0; i < 18; i++) {
    const airline = airlines[i % airlines.length];
    const flightNum = `${airline.code} ${100 + Math.floor(Math.random() * 900)}`;
    const hour = 6 + Math.floor(i * 1.1);
    const minute = (i * 17) % 60;
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const status = statuses[i % statuses.length];

    flights.push({
      id: i + 1,
      time,
      destination: destinations[i],
      flightNumber: flightNum,
      airline: airline.name,
      airlineCode: airline.code,
      gate: gates[i],
      status,
    });
  }
  return flights;
}

function readState() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeState(state) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

// === Auto-update flight statuses ===
// Every 30 seconds, randomly update 1-3 flights' statuses to simulate real-time
const ALL_STATUSES = [
  { ja: '定刻', en: 'On Time', zh: '准时', ko: '정시' },
  { ja: '搭乗中', en: 'Boarding', zh: '登机中', ko: '탑승 중' },
  { ja: '遅延', en: 'Delayed', zh: '延误', ko: '지연' },
  { ja: '出発済', en: 'Departed', zh: '已起飞', ko: '출발' },
  { ja: '搭乗案内', en: 'Now Boarding', zh: '即将登机', ko: '탑승 안내' },
  { ja: 'ゲート変更', en: 'Gate Changed', zh: '登机口变更', ko: '게이트 변경' },
];

const ALL_GATES = ['G01', 'G02', 'G03', 'G05', 'G07', 'G08', 'G11', 'G12', 'G15', 'G18', 'G20', 'G21', 'G22', 'G25', 'G28', 'G30', 'G31', 'G33'];

function autoUpdateFlights() {
  try {
    const state = readState();
    const flights = state.fids.flights;
    // Pick 1-3 random flights to update
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * flights.length);
      const flight = flights[idx];
      // Random status change
      const newStatus = ALL_STATUSES[Math.floor(Math.random() * ALL_STATUSES.length)];
      flight.status = newStatus;
      // Occasionally change gate (20% chance)
      if (Math.random() < 0.2) {
        flight.gate = ALL_GATES[Math.floor(Math.random() * ALL_GATES.length)];
      }
      // Occasionally add a delay (15% chance)
      if (Math.random() < 0.15) {
        const [h, m] = flight.time.split(':').map(Number);
        const delayMin = 10 + Math.floor(Math.random() * 50);
        const totalMin = h * 60 + m + delayMin;
        const newH = Math.floor(totalMin / 60) % 24;
        const newM = totalMin % 60;
        flight.time = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
        flight.status = { ja: '遅延', en: 'Delayed', zh: '延误', ko: '지연' };
      }
    }
    writeState(state);
    console.log(`🔄 Auto-updated ${count} flight(s) at ${new Date().toLocaleTimeString('ja-JP')}`);
  } catch (e) {
    // ignore errors in auto-update
  }
}

// Run auto-update every 30 seconds
setInterval(autoUpdateFlights, 30000);

// === API Routes ===

// GET full state
app.get('/api/state', (req, res) => {
  res.json(readState());
});

// GET FIDS state
app.get('/api/fids/:id', (req, res) => {
  const state = readState();
  res.json(state.fids);
});

// GET GIDS state
app.get('/api/gids/:id', (req, res) => {
  const state = readState();
  res.json(state.gids);
});

// POST update FIDS settings (languages, interval)
app.post('/api/fids/update', (req, res) => {
  const state = readState();
  const { languages, interval } = req.body;
  if (languages !== undefined) state.fids.languages = languages;
  if (interval !== undefined) state.fids.interval = interval;
  writeState(state);
  res.json({ success: true, fids: state.fids });
});

// POST update a single flight
app.post('/api/fids/flight/update', (req, res) => {
  const state = readState();
  const { id, time, flightNumber, gate, statusKey } = req.body;
  const flight = state.fids.flights.find(f => f.id === id);
  if (!flight) {
    res.status(404).json({ error: 'Flight not found' });
    return;
  }
  if (time !== undefined) flight.time = time;
  if (flightNumber !== undefined) flight.flightNumber = flightNumber;
  if (gate !== undefined) flight.gate = gate;
  if (statusKey !== undefined) {
    const statusMap = {
      ontime: { ja: '定刻', en: 'On Time', zh: '准时', ko: '정시' },
      boarding: { ja: '搭乗中', en: 'Boarding', zh: '登机中', ko: '탑승 중' },
      nowboarding: { ja: '搭乗案内', en: 'Now Boarding', zh: '即将登机', ko: '탑승 안내' },
      delayed: { ja: '遅延', en: 'Delayed', zh: '延误', ko: '지연' },
      departed: { ja: '出発済', en: 'Departed', zh: '已起飞', ko: '출발' },
      cancelled: { ja: '欠航', en: 'Cancelled', zh: '取消', ko: '결항' },
      gatechanged: { ja: 'ゲート変更', en: 'Gate Changed', zh: '登机口变更', ko: '게이트 변경' },
    };
    if (statusMap[statusKey]) flight.status = statusMap[statusKey];
  }
  writeState(state);
  res.json({ success: true, flight });
});

// POST update GIDS settings
app.post('/api/gids/update', (req, res) => {
  const state = readState();
  const { status, language, languages, interval } = req.body;
  if (status !== undefined) state.gids.status = status;
  if (language !== undefined) state.gids.language = language;
  if (languages !== undefined) state.gids.languages = languages;
  if (interval !== undefined) state.gids.interval = interval;
  writeState(state);
  res.json({ success: true, gids: state.gids });
});

// Serve frontend static files in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback: any route outside /api returns index.html
  app.get(/(.*)/, (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✈ FIDS/GIDS Server running on port ${PORT}`);
  console.log(`🔄 Flight auto-update running every 30 seconds`);
});
