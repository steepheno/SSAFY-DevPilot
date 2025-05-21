// src/shared/utils/time.ts
/**
 * 1) 밀리초 단위 timestamp → "YYYY-MM-DD HH:mm:ss" 형식
 */
export function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  let h = d.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  h = h % 12;
  if (h === 0) h = 12; // 자정/정오는 12시로 표시

  const hh = String(h).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  return `${yyyy}. ${MM}. ${dd}. ${ampm} ${hh}:${mm}:${ss}`;
}

/**
 * 2) 밀리초 단위 duration → "HH:mm:ss" 형식
 */
export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const HH = String(h).padStart(2, '0');
  const MM = String(m).padStart(2, '0');
  const SS = String(s).padStart(2, '0');
  return `${HH}:${MM}:${SS}`;
}
