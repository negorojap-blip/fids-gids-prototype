import { h, Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';

export function FidsClock() {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }));
    };
    
    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <Fragment>
      <span>{dateStr}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: '1.1rem', marginLeft: '8px' }}>
        {timeStr}
      </span>
    </Fragment>
  );
}
