import { h } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import { EmergencyScreen, EmergencyType } from '../components/EmergencyScreen';
import { FidsTemplateA, Flight, FidsStyle } from '../components/fids/FidsTemplateA';
import { FidsClock } from '../components/fids/FidsClock';

// =============================================
// Types
// =============================================
interface FidsTemplate {
  type: 'json' | 'html';
  url?: string;
}

const DEFAULT_STYLE: FidsStyle = {
  columns: ['time', 'destination', 'flight', 'logo', 'airline', 'gate', 'status', 'terminal', 'checkin', 'codeshare'],
  fontSize: 'M',
  theme: 'dark',
  maxRows: 0,
  headerTitle: '',
};

// =============================================
// Main Component
// =============================================
export function Fids({ id = 'terminal1' }: { id?: string }) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [languages, setLanguages] = useState<string[]>(['ja', 'en']);
  const [interval, setIntervalSec] = useState(5);
  const [template, setTemplate] = useState<FidsTemplate>({ type: 'json' });
  const [fidsStyle, setFidsStyle] = useState<FidsStyle>(DEFAULT_STYLE);
  const [emergencyType, setEmergencyType] = useState<EmergencyType>(null);
  
  // Language Rotation State
  const [langIndex, setLangIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Refs to avoid useEffect re-triggering on identical values
  const prevLangsRef = useRef<string>('');
  const prevTemplateRef = useRef<string>('');
  const prevStyleRef = useRef<string>('');

  // 1) Fetch Data Polling
  useEffect(() => {
    let mounted = true;

    async function fetchFids() {
      try {
        const res = await fetch(`/api/fids/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (!mounted) return;
        
        setFlights(data.flights || []);

        const newLangs = data.languages || ['ja', 'en'];
        const newLangsKey = JSON.stringify(newLangs);
        if (newLangsKey !== prevLangsRef.current) {
          prevLangsRef.current = newLangsKey;
          setLanguages(newLangs);
        }
        
        const newInterval = data.interval || 5;
        setIntervalSec(prev => prev === newInterval ? prev : newInterval);

        const newTemplate = data.template || { type: 'json' };
        const newTemplateKey = JSON.stringify(newTemplate);
        if (newTemplateKey !== prevTemplateRef.current) {
          prevTemplateRef.current = newTemplateKey;
          setTemplate(newTemplate);
        }

        const newStyle = { ...DEFAULT_STYLE, ...(data.style || {}) };
        const newStyleKey = JSON.stringify(newStyle);
        if (newStyleKey !== prevStyleRef.current) {
          prevStyleRef.current = newStyleKey;
          setFidsStyle(newStyle);
        }

        setEmergencyType(data.emergency?.type || null);
        
      } catch (err) {
        console.error('FIDS fetch error:', err);
      }
    }

    fetchFids();
    const iv = setInterval(fetchFids, 3000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [id]);

  // 2) Language Rotation Loop (only when template is 'json')
  useEffect(() => {
    if (template.type !== 'json') return;

    if (languages.length <= 1) {
      setLangIndex(0);
      setIsVisible(true);
      return;
    }

    const intervalMs = (interval || 5) * 1000;
    
    const token = window.setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setLangIndex(prev => (prev + 1) % languages.length);
        setIsVisible(true);
      }, 400);
    }, intervalMs);

    return () => clearInterval(token);
  }, [languages, interval, template.type]);

  // =============================================
  // Render
  // =============================================
  
  if (emergencyType === 'fire' || emergencyType === 'earthquake') {
    return <EmergencyScreen type={emergencyType} />;
  }

  if (template.type === 'html' && template.url) {
    return (
      <iframe
        src={template.url}
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          display: 'block',
        }}
        title="FIDS External Display"
      />
    );
  }

  const currentLang = languages[langIndex] || 'ja';

  return (
    <FidsTemplateA 
      flights={flights}
      lang={currentLang}
      activeLangs={languages}
      timeStr={""}
      dateStr={""}
      isVisible={isVisible}
      fidsStyle={fidsStyle}
    />
  );
}
