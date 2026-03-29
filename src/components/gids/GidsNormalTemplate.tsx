import { h } from 'preact';
import { getTailFinSVG } from '../../utils/tailFin';

export interface GidsTemplateProps {
  lang: string;
  gateId: string;
  flight: {
    flightNumber: string;
    airlineCode: string;
    destination: Record<string, string>;
    departureTime: string;
    boardingTime: string;
    status: Record<string, string>;
  };
  timeStr: string;
}

const STATUS_LABELS: Record<string, Record<string, string>> = {
  normal: { ja: '通常案内', en: 'Normal Service', zh: '正常服务', ko: '정상 안내' },
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

export function GidsNormalTemplate({ lang, gateId, flight, timeStr }: GidsTemplateProps) {
  return (
    <div class="gids-container gids-normal">
      <div class="gids-header">
        <div>
          <div class="gids-gate-label">{TITLE_LABELS[lang] || TITLE_LABELS.en}</div>
          <div class="gids-gate-number">{gateId}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div class="gids-status-badge" style={{ marginBottom: '8px' }}>{STATUS_LABELS.normal[lang]}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{timeStr}</div>
        </div>
      </div>

      <div class="gids-content">
        <div class="gids-flight-info">
          
          <div class="gids-info-card gids-destination-card">
            <div class="gids-info-label">{INFO_LABELS.destination[lang]}</div>
            <div class="gids-info-value">{flight.destination[lang] || flight.destination.en}</div>
          </div>

          <div class="gids-info-card">
            <div class="gids-info-label">{INFO_LABELS.flight[lang]}</div>
            <div class="gids-info-value" style={{ display: 'flex', alignItems: 'center' }}>
              <div 
                class="airline-logo-container" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                dangerouslySetInnerHTML={{ __html: getTailFinSVG(flight.airlineCode, 48) }} 
              />
              <span style={{ marginLeft: '16px' }}>{flight.flightNumber}</span>
            </div>
          </div>

          <div class="gids-info-card">
            <div class="gids-info-label">{INFO_LABELS.departure[lang]}</div>
            <div class="gids-info-value" style={{ fontVariantNumeric: 'tabular-nums' }}>{flight.departureTime}</div>
          </div>

          <div class="gids-info-card">
            <div class="gids-info-label">{INFO_LABELS.boarding[lang]}</div>
            <div class="gids-info-value" style={{ fontVariantNumeric: 'tabular-nums' }}>{flight.boardingTime}</div>
          </div>

          <div class="gids-info-card">
            <div class="gids-info-label">{INFO_LABELS.status[lang]}</div>
            <div class="gids-info-value">{flight.status[lang] || flight.status.en}</div>
          </div>

        </div>
      </div>
    </div>
  );
}
