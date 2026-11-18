import React, { useEffect, useMemo, useState } from 'react';
import type { FeedingEntry } from '../types/baby';
import { formatShortDate, parseISODate, shiftISODate } from '../utils/age';

export type FeedingGranularity = 'daily' | 'weekly' | 'monthly';

interface FeedingBucket {
  key: string;
  axisLabel: string;
  fullLabel: string;
  totalMl: number;
  sessions: number;
  formulaCount: number;
  breastCount: number;
  breastMinutes: number;
}

function getMondayISO(dateStr: string): string {
  const dt = parseISODate(dateStr) ?? new Date();
  const day = dt.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diffToMon);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function shiftMonthKey(monthKey: string, offsetMonths: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const dt = new Date(y, m - 1 + offsetMonths, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function buildBuckets(
  feedings: FeedingEntry[],
  granularity: FeedingGranularity,
  anchorDate: string
): FeedingBucket[] {
  const map = new Map<string, FeedingBucket>();

  if (granularity === 'daily') {
    const daysCount = 14;
    for (let i = daysCount - 1; i >= 0; i--) {
      const dateStr = shiftISODate(anchorDate, -i);
      map.set(dateStr, {
        key: dateStr,
        axisLabel: formatShortDate(dateStr),
        fullLabel: dateStr,
        totalMl: 0,
        sessions: 0,
        formulaCount: 0,
        breastCount: 0,
        breastMinutes: 0,
      });
    }

    for (const f of feedings) {
      const bucket = map.get(f.date);
      if (!bucket) continue;
      if (f.type === 'formula') {
        bucket.formulaCount += 1;
        bucket.sessions += 1;
        bucket.totalMl += f.amountMl ?? 0;
      } else if (f.type === 'breast') {
        bucket.breastCount += 1;
        bucket.sessions += 1;
        bucket.breastMinutes += f.durationMinutes ?? 0;
      }
    }
    return Array.from(map.values());
  }

  if (granularity === 'weekly') {
    const anchorMonday = getMondayISO(anchorDate);
    const weeksCount = 8;
    for (let i = weeksCount - 1; i >= 0; i--) {
      const mon = shiftISODate(anchorMonday, -i * 7);
      const sun = shiftISODate(mon, 6);
      map.set(mon, {
        key: mon,
        axisLabel: `${formatShortDate(mon)}`,
        fullLabel: `${mon} ~ ${sun}`,
        totalMl: 0,
        sessions: 0,
        formulaCount: 0,
        breastCount: 0,
        breastMinutes: 0,
      });
    }

    for (const f of feedings) {
      const mon = getMondayISO(f.date);
      const bucket = map.get(mon);
      if (!bucket) continue;
      if (f.type === 'formula') {
        bucket.formulaCount += 1;
        bucket.sessions += 1;
        bucket.totalMl += f.amountMl ?? 0;
      } else if (f.type === 'breast') {
        bucket.breastCount += 1;
        bucket.sessions += 1;
        bucket.breastMinutes += f.durationMinutes ?? 0;
      }
    }
    return Array.from(map.values());
  }

  const anchorMonth = getMonthKey(anchorDate);
  const monthsCount = 6;
  for (let i = monthsCount - 1; i >= 0; i--) {
    const mk = shiftMonthKey(anchorMonth, -i);
    const [y, m] = mk.split('-').map(Number);
    map.set(mk, {
      key: mk,
      axisLabel: `${m}月`,
      fullLabel: `${y}年${m}月`,
      totalMl: 0,
      sessions: 0,
      formulaCount: 0,
      breastCount: 0,
      breastMinutes: 0,
    });
  }

  for (const f of feedings) {
    const mk = getMonthKey(f.date);
    const bucket = map.get(mk);
    if (!bucket) continue;
    if (f.type === 'formula') {
      bucket.formulaCount += 1;
      bucket.sessions += 1;
      bucket.totalMl += f.amountMl ?? 0;
    } else if (f.type === 'breast') {
      bucket.breastCount += 1;
      bucket.sessions += 1;
      bucket.breastMinutes += f.durationMinutes ?? 0;
    }
  }
  return Array.from(map.values());
}

export const FeedingTrendChart: React.FC<{
  feedings: FeedingEntry[];
  anchorDate: string;
}> = ({ feedings, anchorDate }) => {
  const [granularity, setGranularity] = useState<FeedingGranularity>('daily');

  const buckets = useMemo(
    () => buildBuckets(feedings, granularity, anchorDate),
    [feedings, granularity, anchorDate]
  );

  const defaultIdx = useMemo(() => {
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (buckets[i].sessions > 0 || buckets[i].totalMl > 0) return i;
    }
    return Math.max(0, buckets.length - 1);
  }, [buckets]);

  const [activeIndex, setActiveIndex] = useState(defaultIdx);

  useEffect(() => {
    setActiveIndex(defaultIdx);
  }, [defaultIdx, granularity, anchorDate]);

  const hasAnyDataInWindow = buckets.some((b) => b.sessions > 0 || b.totalMl > 0);
  const safeIdx = Math.min(activeIndex, Math.max(0, buckets.length - 1));
  const activeBucket = buckets[safeIdx];

  const width = 560;
  const height = 248;
  const padLeft = 48;
  const padRight = 40;
  const padTop = 22;
  const padBottom = 34;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const maxMl = Math.max(100, ...buckets.map((b) => b.totalMl));
  const niceMaxMl = Math.ceil(maxMl / 100) * 100;

  const maxSessions = Math.max(4, ...buckets.map((b) => b.sessions));
  const niceMaxSessions =
    maxSessions <= 8 ? Math.max(4, maxSessions) : Math.ceil(maxSessions / 4) * 4;

  const coords = buckets.map((b, idx) => {
    const x =
      buckets.length <= 1
        ? padLeft + innerW / 2
        : padLeft + (idx / (buckets.length - 1)) * innerW;
    const yMl = padTop + innerH - (b.totalMl / niceMaxMl) * innerH;
    const ySessions = padTop + innerH - (b.sessions / niceMaxSessions) * innerH;
    return { ...b, x, yMl, ySessions };
  });

  const mlLinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.yMl.toFixed(1)}`).join(' ');
  const sessionLinePoints = coords
    .map((c) => `${c.x.toFixed(1)},${c.ySessions.toFixed(1)}`)
    .join(' ');

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <section className="sketch-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#3F302D]">奶量与顿数趋势</h2>
          <p className="text-xs text-[#755F5C] mt-0.5">
            统计配方奶总量 (ml) 与吃奶顿数（配方奶+母乳）
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 rounded-[13px] bg-[#F6E7E9] border border-[#9A7276]/25 shrink-0">
          {(
            [
              { id: 'daily', label: '每天' },
              { id: 'weekly', label: '每周' },
              { id: 'monthly', label: '每月' },
            ] as Array<{ id: FeedingGranularity; label: string }>
          ).map((item) => {
            const active = granularity === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setGranularity(item.id)}
                className={`min-h-[40px] px-3.5 py-1.5 text-xs font-bold rounded-[10px] transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#4D7FA3] text-[#FCF8EC] shadow-sm'
                    : 'text-[#755F5C] hover:text-[#3F302D]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {!hasAnyDataInWindow ? (
        <div className="p-6 rounded-[14px] bg-[#FCF2D2] stitched-frame text-center space-y-1.5">
          <div className="text-sm font-bold text-[#3F302D]">当前周期暂无吃奶数据</div>
          <p className="text-xs text-[#755F5C]">
            记录配方奶或母乳喂养后，这里会用双折线展示每天、每周、每月的总奶量与顿数变化。
          </p>
        </div>
      ) : (
        <>
          {activeBucket && (
            <div className="p-3.5 rounded-[14px] bg-[#FCF2D2] border border-[#D6A53A]/30 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#755F5C] tabular-nums">
                  {activeBucket.fullLabel}
                  {granularity === 'weekly' ? '（整周）' : ''}
                </div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-base font-bold text-[#4D7FA3] tabular-nums">
                    总奶量 {activeBucket.totalMl} ml
                  </span>
                  <span className="text-base font-bold text-[#D64E38] tabular-nums">
                    喂奶 {activeBucket.sessions} 顿
                  </span>
                </div>
                {(activeBucket.formulaCount > 0 || activeBucket.breastCount > 0) && (
                  <div className="text-[11px] font-medium text-[#755F5C] tabular-nums">
                    配方奶 {activeBucket.formulaCount} 顿 · 母乳 {activeBucket.breastCount} 顿
                    {activeBucket.breastMinutes > 0
                      ? `（共 ${activeBucket.breastMinutes} 分钟）`
                      : ''}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-[#3F302D]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4 h-1 bg-[#4D7FA3] inline-block rounded-full" />
                  总量 (ml)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4 h-0.5 border-t-[2.5px] border-dashed border-[#D64E38] inline-block" />
                  顿数 (顿)
                </span>
              </div>
            </div>
          )}

          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto select-none"
              role="img"
              aria-label="奶量与顿数双折线统计图"
            >
              <defs>
                <filter id="feedingPencilTexture" x="-5%" y="-5%" width="110%" height="110%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.06"
                    numOctaves="2"
                    result="noise"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale="1.2"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              </defs>

              {gridSteps.map((step, i) => {
                const y = padTop + innerH - step * innerH;
                const mlTick = Math.round(step * niceMaxMl);
                const sessionTick = Math.round(step * niceMaxSessions);
                return (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={width - padRight}
                      y2={y}
                      stroke="rgba(154, 114, 118, 0.22)"
                      strokeWidth="1"
                      strokeDasharray="5 4"
                    />
                    <text
                      x={padLeft - 7}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10.5"
                      fontWeight="600"
                      fill="#4D7FA3"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {mlTick}
                    </text>
                    <text
                      x={width - padRight + 7}
                      y={y + 4}
                      textAnchor="start"
                      fontSize="10.5"
                      fontWeight="600"
                      fill="#D64E38"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {sessionTick}顿
                    </text>
                  </g>
                );
              })}

              <line
                x1={padLeft}
                y1={padTop}
                x2={padLeft}
                y2={padTop + innerH}
                stroke="rgba(77, 127, 163, 0.45)"
                strokeWidth="1.4"
                filter="url(#feedingPencilTexture)"
              />
              <line
                x1={width - padRight}
                y1={padTop}
                x2={width - padRight}
                y2={padTop + innerH}
                stroke="rgba(214, 78, 56, 0.45)"
                strokeWidth="1.4"
                filter="url(#feedingPencilTexture)"
              />
              <line
                x1={padLeft}
                y1={padTop + innerH}
                x2={width - padRight}
                y2={padTop + innerH}
                stroke="rgba(154, 114, 118, 0.35)"
                strokeWidth="1.4"
                filter="url(#feedingPencilTexture)"
              />

              {coords[safeIdx] && (
                <line
                  x1={coords[safeIdx].x}
                  y1={padTop}
                  x2={coords[safeIdx].x}
                  y2={padTop + innerH}
                  stroke="rgba(154, 114, 118, 0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              )}

              {coords.length >= 2 && (
                <polyline
                  fill="none"
                  stroke="#4D7FA3"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={mlLinePoints}
                  filter="url(#feedingPencilTexture)"
                />
              )}

              {coords.length >= 2 && (
                <polyline
                  fill="none"
                  stroke="#D64E38"
                  strokeWidth="2.4"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sessionLinePoints}
                  filter="url(#feedingPencilTexture)"
                />
              )}

              {coords.map((pt, idx) => {
                const isActive = idx === safeIdx;
                const showXLabel =
                  granularity !== 'daily' ||
                  idx === 0 ||
                  idx === coords.length - 1 ||
                  idx % 3 === 0;

                return (
                  <g key={pt.key}>
                    {showXLabel && (
                      <text
                        x={pt.x}
                        y={height - 10}
                        textAnchor="middle"
                        fontSize="10.5"
                        fill={isActive ? '#3F302D' : '#755F5C'}
                        fontWeight={isActive ? '700' : '500'}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {pt.axisLabel}
                      </text>
                    )}

                    <circle
                      cx={pt.x}
                      cy={pt.ySessions}
                      r={isActive ? 5 : 3.6}
                      fill={isActive ? '#D64E38' : '#FCF8EC'}
                      stroke="#D64E38"
                      strokeWidth="2"
                      pointerEvents="none"
                    />

                    <circle
                      cx={pt.x}
                      cy={pt.yMl}
                      r={isActive ? 5.5 : 4}
                      fill={isActive ? '#4D7FA3' : '#FCF8EC'}
                      stroke="#4D7FA3"
                      strokeWidth="2.2"
                      pointerEvents="none"
                    />

                    <rect
                      x={pt.x - innerW / Math.max(1, coords.length * 2)}
                      y={padTop}
                      width={Math.max(24, innerW / Math.max(1, coords.length))}
                      height={innerH + 20}
                      fill="transparent"
                      className="cursor-pointer"
                      onClick={() => setActiveIndex(idx)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="text-[11px] font-medium text-[#755F5C] text-center">
            轻点图上任意{granularity === 'daily' ? '日期' : granularity === 'weekly' ? '周次' : '月份'}列查看奶量与顿数明细
          </p>
        </>
      )}
    </section>
  );
};
