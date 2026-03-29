import { h } from 'preact';
import { GidsTemplateProps } from './GidsNormalTemplate';

const STATUS_LABELS: Record<string, Record<string, string>> = {
  closed: { ja: '搭乗終了', en: 'Boarding Closed', zh: '登机结束', ko: '탑승 종료' },
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

export function GidsClosedTemplate({ lang, gateId, flight, timeStr }: GidsTemplateProps) {
  const cm = CLOSED_MESSAGES[lang] || CLOSED_MESSAGES.en;

  return (
    <div class="gids-container gids-closed">
      <div class="gids-closed-topbar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div class="gids-closed-gate" style={{ marginRight: '20px' }}>{gateId}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            {flight.flightNumber} → {flight.destination[lang] || flight.destination.en}
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{timeStr}</div>
      </div>

      <div class="gids-closed-center">
        <div class="gids-closed-icon">✕</div>
        <div class="gids-closed-badge-large">{STATUS_LABELS.closed[lang]}</div>
        <div class="gids-closed-message-line1">{cm[0]}</div>
        <div class="gids-closed-message-line2">{cm[1]}</div>
        <div class="gids-closed-subtext">{CLOSED_SUB[lang] || CLOSED_SUB.en}</div>
      </div>
    </div>
  );
}
