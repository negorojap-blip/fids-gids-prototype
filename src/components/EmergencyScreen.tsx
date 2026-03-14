import { useState, useEffect } from 'preact/hooks';

export type EmergencyType = 'fire' | 'earthquake' | null;

interface EmergencyScreenProps {
  type: EmergencyType;
}

const EMERGENCY_TEXTS = {
  fire: {
    ja: ['火災発生', '直ちに避難してください'],
    en: ['FIRE EMERGENCY', 'EVACUATE IMMEDIATELY'],
    zh: ['发生火灾', '请立即疏散'],
    ko: ['화재 발생', '즉시 대피하십시오'],
  },
  earthquake: {
    ja: ['地震発生', '身の安全を確保し、避難してください'],
    en: ['EARTHQUAKE WARNING', 'SECURE YOUR SAFETY AND EVACUATE'],
    zh: ['发生地震', '请确保安全并疏散'],
    ko: ['지진 발생', '안전을 확보하고 대피하십시오'],
  },
};

const LANGS = ['ja', 'en', 'zh', 'ko'];

export function EmergencyScreen({ type }: EmergencyScreenProps) {
  if (!type) return null;

  const texts = EMERGENCY_TEXTS[type];

  return (
    <div className="emergency-container">
      <div className="emergency-icon">
        <span className="icon-pulse">⚠️</span>
      </div>
      <div className="emergency-content-grid">
        {LANGS.map((lang) => {
          const currentTexts = texts[lang as keyof typeof texts];
          return (
            <div key={lang} className={`emergency-lang-row lang-${lang}`}>
              <div className="emergency-title-small">{currentTexts[0]}</div>
              <div className="emergency-subtitle-small">{currentTexts[1]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
