import { h } from 'preact';
import { getTailFinSVG } from '../../utils/tailFin';
import { GidsTemplateProps } from './GidsNormalTemplate';

const STATUS_LABELS: Record<string, Record<string, string>> = {
  priority: { ja: '優先搭乗中', en: 'Priority Boarding', zh: '优先登机', ko: '우선 탑승 중' },
};

const INFO_LABELS: Record<string, Record<string, string>> = {
  departure: { ja: '出発時刻', en: 'DEPARTURE', zh: '出发时间', ko: '출발 시각' },
  boarding: { ja: '搭乗開始', en: 'BOARDING', zh: '登机时间', ko: '탑승 시작' },
  gate: { ja: 'ゲート', en: 'GATE', zh: '登机口', ko: '게이트' },
};

const PRIORITY_MESSAGES: Record<string, string[]> = {
  ja: ['優先搭乗のお客様は', 'お進みください'],
  en: ['Priority Passengers', 'Please Proceed to Gate'],
  zh: ['优先登机旅客', '请前往登机口'],
  ko: ['우선 탑승 고객님은', '앞으로 와 주세요'],
};

export function GidsPriorityTemplate({ lang, gateId, flight, timeStr }: GidsTemplateProps) {
  const pm = PRIORITY_MESSAGES[lang] || PRIORITY_MESSAGES.en;

  return (
    <div class="gids-container gids-priority">
      <div class="gids-priority-topbar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div class="gids-priority-gate" style={{ marginRight: '20px' }}>{gateId}</div>
          <div class="gids-priority-flight-badge">
            <div 
              class="airline-logo-container" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              dangerouslySetInnerHTML={{ __html: getTailFinSVG(flight.airlineCode, 36) }} 
            />
            <span>{flight.flightNumber}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>
            {flight.destination[lang] || flight.destination.en}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{timeStr}</div>
        </div>
      </div>

      <div class="gids-priority-center">
        <div class="gids-priority-icon">✈</div>
        <div class="gids-priority-badge-large">{STATUS_LABELS.priority[lang]}</div>
        <div class="gids-priority-message-line1">{pm[0]}</div>
        <div class="gids-priority-message-line2">{pm[1]}</div>

        <div class="gids-priority-detail-row">
          <div class="gids-priority-detail-item">
            <span class="gids-priority-detail-label">{INFO_LABELS.departure[lang]}</span>
            <span class="gids-priority-detail-value">{flight.departureTime}</span>
          </div>
          <div class="gids-priority-detail-divider" />
          <div class="gids-priority-detail-item">
            <span class="gids-priority-detail-label">{INFO_LABELS.boarding[lang]}</span>
            <span class="gids-priority-detail-value">{flight.boardingTime}</span>
          </div>
          <div class="gids-priority-detail-divider" />
          <div class="gids-priority-detail-item">
            <span class="gids-priority-detail-label">{INFO_LABELS.gate[lang]}</span>
            <span class="gids-priority-detail-value">{gateId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
