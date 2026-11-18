import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Edit3, Plus, Ruler, Trash2 } from 'lucide-react';
import type { BabyProfile, GrowthEntry, GrowthMetric } from '../types/baby';
import { formatShortDate, getTodayISO } from '../utils/age';
import { generateId } from '../utils/media';
import { ConfirmDeleteDialog, RecorderPicker } from './SketchPrimitives';

interface GrowthViewProps {
  profile: BabyProfile;
  growth: GrowthEntry[];
  initialAction?: string | null;
  onConsumeAction?: () => void;
  onSaveGrowth: (entry: GrowthEntry) => Promise<void>;
  onDeleteGrowth: (id: string) => Promise<void>;
}

const METRIC_META: Record<
  GrowthMetric,
  { label: string; unit: string; color: string; softBg: string; borderColor: string; decimals: number }
> = {
  heightCm: {
    label: '身高',
    unit: 'cm',
    color: '#4D7FA3',
    softBg: '#E2EFF7',
    borderColor: 'rgba(91, 146, 184, 0.3)',
    decimals: 1,
  },
  weightKg: {
    label: '体重',
    unit: 'kg',
    color: '#7A8F36',
    softBg: '#EBF0D1',
    borderColor: 'rgba(122, 143, 54, 0.3)',
    decimals: 2,
  },
  headCm: {
    label: '头围',
    unit: 'cm',
    color: '#D64E38',
    softBg: '#FBE5E0',
    borderColor: 'rgba(214, 78, 56, 0.3)',
    decimals: 1,
  },
};

export const GrowthView: React.FC<GrowthViewProps> = ({
  profile,
  growth,
  initialAction,
  onConsumeAction,
  onSaveGrowth,
  onDeleteGrowth,
}) => {
  const [metric, setMetric] = useState<GrowthMetric>('heightCm');
  const [formState, setFormState] = useState<{ open: boolean; editing?: GrowthEntry }>({
    open: false,
  });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (initialAction === 'new-growth') {
      setFormState({ open: true });
      onConsumeAction?.();
    }
  }, [initialAction, onConsumeAction]);

  const sortedDesc = useMemo(
    () =>
      [...growth].sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [growth]
  );

  const chartPoints = useMemo(() => {
    const filtered = growth
      .filter((g) => typeof g[metric] === 'number' && (g[metric] as number) > 0)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.createdAt.localeCompare(b.createdAt);
      });

    return filtered.map((entry) => ({
      id: entry.id,
      date: entry.date,
      value: entry[metric] as number,
      recorder: entry.recorder,
    }));
  }, [growth, metric]);

  if (formState.open) {
    return (
      <GrowthForm
        profile={profile}
        editing={formState.editing}
        onCancel={() => setFormState({ open: false })}
        onSave={async (entry) => {
          await onSaveGrowth(entry);
          setFormState({ open: false });
        }}
      />
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#3F302D]">成长曲线</h1>
          <p className="text-xs font-medium text-[#755F5C] mt-0.5">
            仅绘制宝宝自身测量走势，不叠加百分位标准
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormState({ open: true })}
          className="min-h-[44px] px-4 py-2 text-sm font-bold sketch-btn-primary inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          记测量
        </button>
      </div>

      {/* 3-Segment Metric Switcher */}
      <div className="sketch-card p-1.5 grid grid-cols-3 gap-1.5">
        {(['heightCm', 'weightKg', 'headCm'] as GrowthMetric[]).map((m) => {
          const active = metric === m;
          const info = METRIC_META[m];
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`min-h-[44px] px-3 py-2 text-sm font-bold rounded-[12px] transition-colors cursor-pointer ${
                active
                  ? 'bg-[#4D7FA3] text-[#FCF8EC] shadow-sm'
                  : 'text-[#755F5C] hover:bg-[#F6E7E9] hover:text-[#3F302D]'
              }`}
            >
              {info.label} ({info.unit})
            </button>
          );
        })}
      </div>

      <GrowthPencilChart metric={metric} points={chartPoints} />

      {/* History List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-[#3F302D]">测量历史记录</h2>
          <span className="text-xs font-semibold text-[#755F5C] tabular-nums">
            共 {sortedDesc.length} 次
          </span>
        </div>

        {sortedDesc.length === 0 ? (
          <div className="sketch-card p-6 text-center space-y-3">
            <div className="w-11 h-11 mx-auto rounded-[13px] bg-[#FCF2D2] text-[#3F302D] flex items-center justify-center">
              <Ruler className="w-5 h-5" />
            </div>
            <p className="text-sm text-[#755F5C]">
              还没有成长测量记录，身高、体重、头围可任填一项保存。
            </p>
            <button
              type="button"
              onClick={() => setFormState({ open: true })}
              className="min-h-[44px] px-5 py-2 text-sm font-bold sketch-btn-primary inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              记下第一条测量
            </button>
          </div>
        ) : (
          <div className="sketch-card divide-y divide-dashed divide-[#9A7276]/25">
            {sortedDesc.map((entry) => (
              <div key={entry.id} className="p-4 flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#755F5C] tabular-nums">
                    <span className="font-bold text-[#3F302D]">{entry.date}</span>
                    <span aria-hidden="true">·</span>
                    <span>记录人：{entry.recorder}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#3F302D] tabular-nums">
                    {entry.heightCm !== undefined && (
                      <span>
                        身高 <strong className="text-[#4D7FA3]">{entry.heightCm}</strong> cm
                      </span>
                    )}
                    {entry.weightKg !== undefined && (
                      <span>
                        体重 <strong className="text-[#6B7F30]">{entry.weightKg}</strong> kg
                      </span>
                    )}
                    {entry.headCm !== undefined && (
                      <span>
                        头围 <strong className="text-[#D64E38]">{entry.headCm}</strong> cm
                      </span>
                    )}
                  </div>

                  {entry.note && (
                    <p className="text-xs text-[#755F5C] leading-relaxed break-words">
                      {entry.note}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label="编辑测量记录"
                    onClick={() => setFormState({ open: true, editing: entry })}
                    className="min-h-[44px] min-w-[44px] rounded-[11px] hover:bg-[#F6E7E9] flex items-center justify-center text-[#3F302D] cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="删除测量记录"
                    onClick={() => setPendingDeleteId(entry.id)}
                    className="min-h-[44px] min-w-[44px] rounded-[11px] hover:bg-[#FBE5E0] flex items-center justify-center text-[#D64E38] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDeleteDialog
        open={pendingDeleteId !== null}
        title="删除这条成长记录？"
        description="删除后对应日期的曲线数据点也会移除。"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={async () => {
          if (!pendingDeleteId) return;
          const id = pendingDeleteId;
          setPendingDeleteId(null);
          await onDeleteGrowth(id);
        }}
      />
    </div>
  );
};

interface ChartPoint {
  id: string;
  date: string;
  value: number;
  recorder: string;
}

const GrowthPencilChart: React.FC<{
  metric: GrowthMetric;
  points: ChartPoint[];
}> = ({ metric, points }) => {
  const info = METRIC_META[metric];
  const [activeIndex, setActiveIndex] = useState<number>(Math.max(0, points.length - 1));

  useEffect(() => {
    setActiveIndex(Math.max(0, points.length - 1));
  }, [metric, points.length]);

  const width = 560;
  const height = 240;
  const padLeft = 46;
  const padRight = 22;
  const padTop = 22;
  const padBottom = 34;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  if (points.length === 0) {
    return (
      <div className="sketch-card p-6 text-center space-y-2">
        <div className="text-sm font-bold text-[#3F302D]">暂无{info.label}记录</div>
        <p className="text-xs text-[#755F5C]">
          点击右上角“记测量”录入{info.label}数值后，这里将用彩色铅笔绘制宝宝专属走势。
        </p>
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = rawMax - rawMin;
  const padRange = span > 0 ? span * 0.22 : Math.max(1, rawMin * 0.08);
  const yMin = Math.max(0, rawMin - padRange);
  const yMax = rawMax + padRange;
  const ySpan = Math.max(0.5, yMax - yMin);

  const coords = points.map((p, idx) => {
    const x =
      points.length === 1
        ? padLeft + innerW / 2
        : padLeft + (idx / (points.length - 1)) * innerW;
    const y = padTop + innerH - ((p.value - yMin) / ySpan) * innerH;
    return { ...p, x, y };
  });

  const polylinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padTop + innerH - t * innerH,
    label: (yMin + t * ySpan).toFixed(info.decimals),
  }));

  const safeIdx = Math.min(activeIndex, coords.length - 1);
  const activePoint = coords[safeIdx];
  const prevPoint = safeIdx > 0 ? coords[safeIdx - 1] : null;
  const delta = prevPoint ? activePoint.value - prevPoint.value : null;

  return (
    <section className="sketch-card p-4 sm:p-5 space-y-3">
      <div
        className="p-3 rounded-[13px] border flex flex-wrap items-center justify-between gap-2"
        style={{ backgroundColor: info.softBg, borderColor: info.borderColor }}
      >
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-[#755F5C] tabular-nums">
            {activePoint.date} · {activePoint.recorder}
          </div>
          <div className="text-xl font-bold text-[#3F302D] tabular-nums">
            {info.label} {activePoint.value.toFixed(info.decimals)}{' '}
            <span className="text-xs font-normal text-[#755F5C]">{info.unit}</span>
          </div>
        </div>
        <div className="text-right">
          {delta !== null ? (
            <div className="text-xs font-bold text-[#3F302D] tabular-nums">
              较上次 {delta >= 0 ? '+' : ''}
              {delta.toFixed(info.decimals)} {info.unit}
            </div>
          ) : (
            <div className="text-xs font-semibold text-[#755F5C]">首次测量点</div>
          )}
          <div className="text-[11px] text-[#755F5C] mt-0.5">轻点圆点切换查看日期</div>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label={`${info.label}成长手绘折线图`}
        >
          <defs>
            <filter id="pencilTexture" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.06"
                numOctaves="2"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="1.3"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>

          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={width - padRight}
                y2={tick.y}
                stroke="rgba(154, 114, 118, 0.22)"
                strokeWidth="1"
                strokeDasharray="5 4"
              />
              <text
                x={padLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="11"
                fontWeight="600"
                fill="#755F5C"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {tick.label}
              </text>
            </g>
          ))}

          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + innerH}
            stroke="rgba(154, 114, 118, 0.42)"
            strokeWidth="1.4"
            filter="url(#pencilTexture)"
          />
          <line
            x1={padLeft}
            y1={padTop + innerH}
            x2={width - padRight}
            y2={padTop + innerH}
            stroke="rgba(154, 114, 118, 0.42)"
            strokeWidth="1.4"
            filter="url(#pencilTexture)"
          />

          {coords.length >= 2 && (
            <polyline
              fill="none"
              stroke={info.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
              filter="url(#pencilTexture)"
            />
          )}

          {coords.map((pt, idx) => {
            const isActive = idx === safeIdx;
            const showDateLabel =
              coords.length <= 6 ||
              idx === 0 ||
              idx === coords.length - 1 ||
              idx % Math.ceil(coords.length / 5) === 0;

            return (
              <g key={pt.id}>
                {showDateLabel && (
                  <text
                    x={pt.x}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isActive ? '700' : '500'}
                    fill={isActive ? '#3F302D' : '#755F5C'}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatShortDate(pt.date)}
                  </text>
                )}

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={18}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => setActiveIndex(idx)}
                />

                {isActive && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={9}
                    fill={info.color}
                    fillOpacity="0.2"
                    pointerEvents="none"
                  />
                )}

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 5.6 : 4.2}
                  fill={isActive ? info.color : '#FCF8EC'}
                  stroke={info.color}
                  strokeWidth="2.2"
                  pointerEvents="none"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {points.length === 1 && (
        <p className="text-xs font-medium text-[#755F5C] text-center">
          当前仅 1 条{info.label}记录，再记录一次即可连成手绘折线。
        </p>
      )}
    </section>
  );
};

const GrowthForm: React.FC<{
  profile: BabyProfile;
  editing?: GrowthEntry;
  onCancel: () => void;
  onSave: (entry: GrowthEntry) => Promise<void>;
}> = ({ profile, editing, onCancel, onSave }) => {
  const defaultRecorder = profile.recorders[0] ?? '妈妈';
  const [date, setDate] = useState(editing?.date ?? getTodayISO());
  const [heightCm, setHeightCm] = useState(
    editing?.heightCm !== undefined ? String(editing.heightCm) : ''
  );
  const [weightKg, setWeightKg] = useState(
    editing?.weightKg !== undefined ? String(editing.weightKg) : ''
  );
  const [headCm, setHeadCm] = useState(
    editing?.headCm !== undefined ? String(editing.headCm) : ''
  );
  const [note, setNote] = useState(editing?.note ?? '');
  const [recorder, setRecorder] = useState(editing?.recorder ?? defaultRecorder);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!date) {
      setErrorMsg('请选择测量日期');
      return;
    }

    const h = heightCm.trim() ? Number(heightCm) : undefined;
    const w = weightKg.trim() ? Number(weightKg) : undefined;
    const head = headCm.trim() ? Number(headCm) : undefined;

    if (h === undefined && w === undefined && head === undefined) {
      setErrorMsg('身高、体重、头围三项请至少填写其中一项');
      return;
    }

    if (
      (h !== undefined && (Number.isNaN(h) || h <= 0 || h > 200)) ||
      (w !== undefined && (Number.isNaN(w) || w <= 0 || w > 100)) ||
      (head !== undefined && (Number.isNaN(head) || head <= 0 || head > 80))
    ) {
      setErrorMsg('请核对输入数值是否在合理范围内');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      await onSave({
        id: editing?.id ?? generateId('growth'),
        date,
        heightCm: h,
        weightKg: w,
        headCm: head,
        recorder,
        note: note.trim() || undefined,
        createdAt: editing?.createdAt ?? now,
        updatedAt: now,
      });
    } catch {
      setErrorMsg('保存测量记录失败，请重试');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] px-3 py-2 text-sm font-semibold text-[#3F302D] hover:bg-[#F4D3D8]/60 rounded-[12px] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          取消
        </button>
        <h1 className="text-xl font-bold text-[#3F302D]">
          {editing ? '编辑测量' : '记录身高体重'}
        </h1>
        <div className="w-16" />
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-[14px] bg-[#FBE5E0] border border-[#D64E38]/30 text-sm font-medium text-[#8B2718]">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="sketch-card p-5 sm:p-6 space-y-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-[#3F302D]">测量日期</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input tabular-nums"
          />
        </label>

        <div className="space-y-1">
          <span className="text-sm font-bold text-[#3F302D]">
            测量数据（三项至少填一项，其余可留空）
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-[#4D7FA3]">身高 (cm)</span>
            <input
              type="number"
              step="0.1"
              min="20"
              max="200"
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="例如 62.5"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input tabular-nums"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-[#6B7F30]">体重 (kg)</span>
            <input
              type="number"
              step="0.01"
              min="0.5"
              max="80"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="例如 6.45"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input tabular-nums"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-[#D64E38]">头围 (cm)</span>
            <input
              type="number"
              step="0.1"
              min="20"
              max="70"
              inputMode="decimal"
              value={headCm}
              onChange={(e) => setHeadCm(e.target.value)}
              placeholder="例如 41.2"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input tabular-nums"
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-[#3F302D]">备注（可选）</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：满月儿保体检测量"
            className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input"
          />
        </label>

        <RecorderPicker recorders={profile.recorders} value={recorder} onChange={setRecorder} />

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[48px] text-sm font-semibold sketch-btn-secondary cursor-pointer"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-[2] min-h-[48px] text-sm font-bold sketch-btn-primary cursor-pointer"
          >
            {saving ? '保存中…' : '保存成长记录'}
          </button>
        </div>
      </form>
    </div>
  );
};
