import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { EmergencyScreen, EmergencyType } from '../components/EmergencyScreen';
import { GidsNormalTemplate } from '../components/gids/GidsNormalTemplate';
import { GidsPriorityTemplate } from '../components/gids/GidsPriorityTemplate';
import { GidsClosedTemplate } from '../components/gids/GidsClosedTemplate';

// =============================================
// Types
// =============================================

export interface FlightData {
  flightNumber: string;
  airlineCode: string;
  destination: Record<string, string>;
  departureTime: string;
  boardingTime: string;
  status: Record<string, string>;
  template?: 'normal' | 'priority' | 'closed';
  gateId?: string;
}

const LANGS = ['ja', 'en', 'zh', 'ko'];

// =============================================
// Formatters
// =============================================

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// =============================================
// Main Component
// =============================================

export function Gids({ id, gateId }: { id?: string, gateId?: string }) {
  const targetGateId = gateId || id || 'G11';

  // Normalize gateId format from URL param 'gate11' -> 'G11'
  const normalizedGateId = targetGateId.toLowerCase().startsWith('gate') 
    ? `G${targetGateId.slice(4)}` 
    : targetGateId.toUpperCase();

  // State
  const [data, setData] = useState<FlightData | null>(null);
  const [langIndex, setLangIndex] = useState(0);
  const [emergency, setEmergency] = useState<EmergencyType>(null);
  const [timeStr, setTimeStr] = useState(formatTime(new Date()));

  // Fetch Data
  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const res = await fetch(`/api/gids/${normalizedGateId}`);
        if (!res.ok) return;
        const json = await res.json();
        
        if (!mounted) return;
        setData(json.data || null);
        
        const emergencyType = json.emergency && json.emergency !== 'none' ? json.emergency : null;
        if (emergencyType !== emergency) {
          setEmergency(emergencyType as EmergencyType);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    }

    fetchData();
    const iv = setInterval(fetchData, 3000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [normalizedGateId, emergency]);

  // Language & Clock Loops
  useEffect(() => {
    let tickCount = 0;
    const iv = setInterval(() => {
      // Update time every second
      setTimeStr(formatTime(new Date()));
      
      // Update language every 5 seconds
      tickCount++;
      if (tickCount % 5 === 0) {
        setLangIndex(prev => (prev + 1) % LANGS.length);
      }
    }, 1000);
    
    return () => clearInterval(iv);
  }, []);

  // Emergency Render
  if (emergency === 'fire' || emergency === 'earthquake') {
    return <EmergencyScreen type={emergency} />;
  }

  // Loading/No Data Render
  if (!data) {
    return (
      <div class="gids-container" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '2rem' }}>No Data for Gate {normalizedGateId}</p>
      </div>
    );
  }

  // Template Render based on Status
  const currentLang = LANGS[langIndex];
  const tpl = data.template || 'normal';

  if (tpl === 'closed') {
    return <GidsClosedTemplate lang={currentLang} gateId={normalizedGateId} flight={data} timeStr={timeStr} />;
  } else if (tpl === 'priority') {
    return <GidsPriorityTemplate lang={currentLang} gateId={normalizedGateId} flight={data} timeStr={timeStr} />;
  } else {
    return <GidsNormalTemplate lang={currentLang} gateId={normalizedGateId} flight={data} timeStr={timeStr} />;
  }
}
