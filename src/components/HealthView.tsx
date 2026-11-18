import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  Edit3,
  Plus,
  Stethoscope,
  Syringe,
  Thermometer,
  Trash2,
} from 'lucide-react';
import { CHINA_VACCINE_SCHEDULE, ILLNESS_SYMPTOMS } from '../data/presets';
import type {
  BabyProfile,
  IllnessEntry,
  MediaAttachment,
  VaccinePreset,
  VaccineRecord,
} from '../types/baby';
import { addMonthsToISO, diffDaysBetween, getTodayISO } from '../utils/age';
import { generateId } from '../utils/media';
import {
  ConfirmDeleteDialog,
  PhotoLightbox,
  PhotoUploader,
  RecorderPicker,
} from './SketchPrimitives';

interface HealthViewProps {
  profile: BabyProfile;
  vaccineRecords: VaccineRecord[];
  illnesses: IllnessEntry[];
  onSaveVaccineRecord: (record: VaccineRecord) => Promise<void>;
  onDeleteVaccineRecord: (vaccineId: string) => Promise<void>;
  onSaveIllness: (entry: IllnessEntry) => Promise<void>;
  onDeleteIllness: (id: string) => Promise<void>;
}

export const HealthView: React.FC<HealthViewProps> = ({
  profile,
  vaccineRecords,
  illnesses,
  onSaveVaccineRecord,
  onDeleteVaccineRecord,
  onSaveIllness,
  onDeleteIllness,
}) => {
  const [subTab, setSubTab] = useState<'vaccine' | 'illness'>('vaccine');
  const [editingVaccine, setEditingVaccine] = useState<VaccinePreset | null>(null);
  const [illnessFormState, setIllnessFormState] = useState<{
    open: boolean;
    editing?: IllnessEntry;
  }>({ open: false });
  const [pendingDeleteIllnessId, setPendingDeleteIllnessId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<MediaAttachment | null>(null);

  const today = getTodayISO();

  const recordMap = useMemo(() => {
    const map = new Map<string, VaccineRecord>();
    for (const rec of vaccineRecords) {
      map.set(rec.vaccineId, rec);
    }
    return map;
  }, [vaccineRecords]);

  const nextVaccineId = useMemo(() => {
    const next = CHINA_VACCINE_SCHEDULE.find((v) => !recordMap.get(v.id)?.completed);
    return next?.id ?? null;
  }, [recordMap]);

  const completedCount = useMemo(
    () => CHINA_VACCINE_SCHEDULE.filter((v) => recordMap.get(v.id)?.completed).length,
    [recordMap]
  );

  const sortedIllnesses = useMemo(
    () =>
      [...illnesses].sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [illnesses]
  );

  if (illnessFormState.open) {
    return (
      <IllnessForm
        profile={profile}
        editing={illnessFormState.editing}
        onCancel={() => setIllnessFormState({ open: false })}
        onSave={async (entry) => {
          await onSaveIllness(entry);
          setIllnessFormState({ open: false });
          setSubTab('illness');
        }}
      />
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#3F302D]">健康簿</h1>
          <p className="text-xs font-medium text-[#755F5C] mt-0.5 tabular-nums">
            疫苗已完成 {completedCount}/{CHINA_VACCINE_SCHEDULE.length} · 护理记录{' '}
            {sortedIllnesses.length} 条
          </p>
        </div>
        {subTab === 'illness' && (
          <button
            type="button"
            onClick={() => setIllnessFormState({ open: true })}
            className="min-h-[44px] px-4 py-2 text-sm font-bold sketch-btn-primary inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            记不适
          </button>
        )}
      </div>

      {/* Mandatory Non-Medical Disclaimer */}
      <div className="p-3.5 rounded-[15px] bg-[#FCF8EC] border border-[#9A7276]/25 text-xs text-[#3F302D] leading-relaxed flex items-start gap-2.5 shadow-sm">
        <AlertCircle className="w-4 h-4 text-[#D64E38] shrink-0 mt-0.5" />
        <span>
          <strong>非医疗建议提示：</strong>
          本页预置常规接种排期与生病护理日志仅供家庭日常整理参考，不构成医疗诊断或用药建议。具体接种禁忌、发热处置与用药剂量请务必遵医嘱。
        </span>
      </div>

      {/* Sub-Section Switcher */}
      <div className="sketch-card p-1.5 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setSubTab('vaccine')}
          className={`min-h-[44px] px-3 py-2 text-sm font-bold rounded-[12px] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            subTab === 'vaccine'
              ? 'bg-[#4D7FA3] text-[#FCF8EC] shadow-sm'
              : 'text-[#755F5C] hover:bg-[#F6E7E9] hover:text-[#3F302D]'
          }`}
        >
          <Syringe className="w-4 h-4" />
          疫苗接种表
        </button>
        <button
          type="button"
          onClick={() => setSubTab('illness')}
          className={`min-h-[44px] px-3 py-2 text-sm font-bold rounded-[12px] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            subTab === 'illness'
              ? 'bg-[#D64E38] text-[#FCF8EC] shadow-sm'
              : 'text-[#755F5C] hover:bg-[#F6E7E9] hover:text-[#3F302D]'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          生病与护理 ({sortedIllnesses.length})
        </button>
      </div>

      {subTab === 'vaccine' ? (
        <div className="space-y-3.5">
          {CHINA_VACCINE_SCHEDULE.map((vaccine) => {
            const rec = recordMap.get(vaccine.id);
            const completed = Boolean(rec?.completed);
            const isNext = vaccine.id === nextVaccineId;
            const dueDate = profile.birthDate
              ? addMonthsToISO(profile.birthDate, vaccine.targetMonths)
              : null;
            const daysUntil = dueDate ? diffDaysBetween(today, dueDate) : null;

            return (
              <div
                key={vaccine.id}
                className={`p-4 transition-colors ${
                  isNext
                    ? 'sketch-card-wash-ochre'
                    : completed
                      ? 'sketch-card-wash-sage'
                      : 'sketch-card'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-bold text-[#4D7FA3] tabular-nums">
                        {vaccine.ageLabel}
                      </span>
                      <span className="text-[#755F5C]" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-base font-bold text-[#3F302D]">
                        {vaccine.name}（{vaccine.doseLabel}）
                      </span>
                      {isNext && (
                        <span className="text-xs font-bold text-[#D64E38]">· 下一针</span>
                      )}
                    </div>

                    <p className="text-xs text-[#755F5C] leading-relaxed">{vaccine.note}</p>

                    <div className="pt-1 text-xs tabular-nums">
                      {completed ? (
                        <span className="text-[#3F302D] font-bold">
                          已打卡 · 接种日期 {rec?.actualDate ?? '已记录'}
                          {rec?.recorder ? ` · 记录人：${rec.recorder}` : ''}
                        </span>
                      ) : dueDate ? (
                        <span
                          className={
                            daysUntil !== null && daysUntil <= 7
                              ? 'text-[#D64E38] font-bold'
                              : 'text-[#755F5C] font-medium'
                          }
                        >
                          预计日期 {dueDate}
                          {daysUntil !== null &&
                            (daysUntil > 0
                              ? `（还有 ${daysUntil} 天）`
                              : daysUntil === 0
                                ? '（今日可接种）'
                                : `（已超期 ${Math.abs(daysUntil)} 天）`)}
                        </span>
                      ) : (
                        <span className="text-[#755F5C]">设置宝宝出生日期后可自动计算预计接种日</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {completed ? (
                      <button
                        type="button"
                        onClick={() => setEditingVaccine(vaccine)}
                        className="min-h-[44px] px-3 py-2 text-xs font-bold bg-[#FCF8EC] border border-[#7A8F36]/30 text-[#3F302D] rounded-[12px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-[#6B7F30]" />
                        修改/补录
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingVaccine(vaccine)}
                        className={`min-h-[44px] px-3.5 py-2 text-xs font-bold rounded-[12px] cursor-pointer ${
                          isNext
                            ? 'bg-[#D64E38] hover:bg-[#BC3F2B] text-[#FCF8EC] shadow-sm'
                            : 'sketch-btn-secondary'
                        }`}
                      >
                        打卡 / 补录
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedIllnesses.length === 0 ? (
            <div className="sketch-card p-6 sm:p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-full max-w-[240px] mx-auto rounded-[16px] overflow-hidden border border-[#9A7276]/25 shadow-sm">
                <img
                  src="/src/assets/images/empty_health_illustration_1794968780218.jpg"
                  alt="手绘风格体温计、绿叶和小星星插画"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[#3F302D]">暂无生病与不适记录</h2>
                <p className="text-xs text-[#755F5C]">
                  希望宝宝一直健健康康。如遇发热、咳嗽或皮疹等情况，可在此详细记录体温、症状与用药时间。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIllnessFormState({ open: true })}
                className="min-h-[44px] px-5 py-2.5 text-sm font-bold sketch-btn-primary inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                新增护理记录
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {sortedIllnesses.map((item) => {
                const isFever = typeof item.temperature === 'number' && item.temperature >= 37.5;
                const allSymptoms = [
                  ...item.symptoms,
                  ...(item.symptomDetail ? [item.symptomDetail] : []),
                ];

                return (
                  <article key={item.id} className="sketch-card p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-[#755F5C] tabular-nums">
                          <span className="font-bold text-[#3F302D]">{item.date}</span>
                          <span aria-hidden="true">·</span>
                          <span>记录人：{item.recorder}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                          {item.temperature !== undefined && (
                            <span
                              className={`inline-flex items-center gap-1 text-base font-bold tabular-nums ${
                                isFever ? 'text-[#D64E38]' : 'text-[#3F302D]'
                              }`}
                            >
                              <Thermometer className="w-4 h-4" />
                              {item.temperature.toFixed(1)} °C
                              {isFever ? '（发热）' : ''}
                            </span>
                          )}
                          {allSymptoms.length > 0 && (
                            <span className="text-sm font-bold text-[#3F302D]">
                              症状：{allSymptoms.join('、')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label="编辑生病记录"
                          onClick={() => setIllnessFormState({ open: true, editing: item })}
                          className="min-h-[44px] min-w-[44px] rounded-[11px] hover:bg-[#F6E7E9] flex items-center justify-center text-[#3F302D] cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="删除生病记录"
                          onClick={() => setPendingDeleteIllnessId(item.id)}
                          className="min-h-[44px] min-w-[44px] rounded-[11px] hover:bg-[#FBE5E0] flex items-center justify-center text-[#D64E38] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {item.medication && (
                      <div className="text-xs text-[#3F302D] bg-[#FCF2D2] border border-[#D6A53A]/30 px-3 py-2 rounded-[11px]">
                        <span className="font-bold">用药记录：</span>
                        {item.medication}
                      </div>
                    )}

                    {item.note && (
                      <p className="text-xs text-[#755F5C] leading-relaxed break-words">
                        备注：{item.note}
                      </p>
                    )}

                    {item.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.images.map((img) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setLightboxImage(img)}
                            className="w-16 h-16 rounded-[11px] overflow-hidden border border-[#9A7276]/25 cursor-pointer"
                          >
                            <img
                              src={img.dataUrl}
                              alt={img.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Vaccine Check-in / Backfill Modal */}
      {editingVaccine && (
        <VaccineCheckInModal
          vaccine={editingVaccine}
          existing={recordMap.get(editingVaccine.id)}
          recorders={profile.recorders}
          onClose={() => setEditingVaccine(null)}
          onSave={async (rec) => {
            await onSaveVaccineRecord(rec);
            setEditingVaccine(null);
          }}
          onUndo={async () => {
            await onDeleteVaccineRecord(editingVaccine.id);
            setEditingVaccine(null);
          }}
        />
      )}

      {lightboxImage && (
        <PhotoLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}

      <ConfirmDeleteDialog
        open={pendingDeleteIllnessId !== null}
        title="删除这条护理记录？"
        description="删除后体温、用药与附图将从本机清理，无法恢复。"
        onCancel={() => setPendingDeleteIllnessId(null)}
        onConfirm={async () => {
          if (!pendingDeleteIllnessId) return;
          const id = pendingDeleteIllnessId;
          setPendingDeleteIllnessId(null);
          await onDeleteIllness(id);
        }}
      />
    </div>
  );
};

const VaccineCheckInModal: React.FC<{
  vaccine: VaccinePreset;
  existing?: VaccineRecord;
  recorders: string[];
  onClose: () => void;
  onSave: (record: VaccineRecord) => Promise<void>;
  onUndo: () => Promise<void>;
}> = ({ vaccine, existing, recorders, onClose, onSave, onUndo }) => {
  const [actualDate, setActualDate] = useState(existing?.actualDate ?? getTodayISO());
  const [recorder, setRecorder] = useState(existing?.recorder ?? recorders[0] ?? '妈妈');
  const [note, setNote] = useState(existing?.note ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        vaccineId: vaccine.id,
        completed: true,
        actualDate: actualDate || getTodayISO(),
        recorder,
        note: note.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#3F302D]/45 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#FCF8EC] border border-[#9A7276]/30 rounded-[20px_18px_22px_18px] p-5 space-y-4 shadow-xl"
      >
        <div className="space-y-1">
          <div className="text-xs text-[#4D7FA3] font-bold">{vaccine.ageLabel}</div>
          <h3 className="text-lg font-bold text-[#3F302D]">
            {vaccine.name}（{vaccine.doseLabel}）
          </h3>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-[#3F302D] inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#755F5C]" />
            实际接种日期（支持补录）
          </span>
          <input
            type="date"
            value={actualDate}
            onChange={(e) => setActualDate(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input tabular-nums"
          />
        </label>

        <RecorderPicker recorders={recorders} value={recorder} onChange={setRecorder} />

        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-[#3F302D]">接种后观察备注（可选）</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：社区卫生服务中心接种，无明显不适"
            className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input"
          />
        </label>

        <div className="flex flex-col gap-2 pt-1">
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] text-sm font-semibold sketch-btn-secondary cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] min-h-[46px] text-sm font-bold sketch-btn-primary cursor-pointer"
            >
              {saving ? '保存中…' : '确认已接种'}
            </button>
          </div>
          {existing?.completed && (
            <button
              type="button"
              onClick={onUndo}
              className="min-h-[40px] text-xs font-bold text-[#D64E38] hover:underline cursor-pointer"
            >
              撤销此次打卡（恢复为待接种）
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const IllnessForm: React.FC<{
  profile: BabyProfile;
  editing?: IllnessEntry;
  onCancel: () => void;
  onSave: (entry: IllnessEntry) => Promise<void>;
}> = ({ profile, editing, onCancel, onSave }) => {
  const defaultRecorder = profile.recorders[0] ?? '妈妈';
  const [date, setDate] = useState(editing?.date ?? getTodayISO());
  const [temperature, setTemperature] = useState(
    editing?.temperature !== undefined ? String(editing.temperature) : ''
  );
  const [symptoms, setSymptoms] = useState<string[]>(editing?.symptoms ?? []);
  const [symptomDetail, setSymptomDetail] = useState(editing?.symptomDetail ?? '');
  const [medication, setMedication] = useState(editing?.medication ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [images, setImages] = useState<MediaAttachment[]>(editing?.images ?? []);
  const [recorder, setRecorder] = useState(editing?.recorder ?? defaultRecorder);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleSymptom = (sym: string) => {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!date) {
      setErrorMsg('请选择日期');
      return;
    }

    const tempNum = temperature.trim() ? Number(temperature) : undefined;
    if (tempNum !== undefined && (Number.isNaN(tempNum) || tempNum < 34 || tempNum > 43)) {
      setErrorMsg('体温数值应在 34.0°C – 43.0°C 之间');
      return;
    }

    if (
      tempNum === undefined &&
      symptoms.length === 0 &&
      !symptomDetail.trim() &&
      !medication.trim() &&
      !note.trim()
    ) {
      setErrorMsg('请至少填写体温、症状、用药或备注中的一项');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      await onSave({
        id: editing?.id ?? generateId('illness'),
        date,
        temperature: tempNum,
        symptoms,
        symptomDetail: symptomDetail.trim() || undefined,
        medication: medication.trim() || undefined,
        note: note.trim() || undefined,
        images,
        recorder,
        createdAt: editing?.createdAt ?? now,
        updatedAt: now,
      });
    } catch {
      setErrorMsg('保存护理记录失败，请重试');
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
          {editing ? '编辑护理记录' : '新增生病护理'}
        </h1>
        <div className="w-16" />
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-[14px] bg-[#FBE5E0] border border-[#D64E38]/30 text-sm font-medium text-[#8B2718]">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="sketch-card p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-[#3F302D]">日期</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input tabular-nums"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-[#3F302D]">体温 (°C，可选)</span>
            <input
              type="number"
              step="0.1"
              min="34"
              max="43"
              inputMode="decimal"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="例如：37.8"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input tabular-nums"
            />
          </label>
        </div>

        {/* Multi-select Symptoms */}
        <div className="space-y-2">
          <span className="text-sm font-bold text-[#3F302D] block">观察到的症状（可多选）</span>
          <div className="flex flex-wrap gap-2">
            {ILLNESS_SYMPTOMS.map((sym) => {
              const active = symptoms.includes(sym);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => toggleSymptom(sym)}
                  className={`min-h-[40px] px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#D64E38] text-[#FCF8EC] rounded-[12px] shadow-sm'
                      : 'bg-[#F6E7E9] text-[#3F302D] border border-[#9A7276]/25 hover:bg-[#EED8DC] rounded-[12px]'
                  }`}
                >
                  {sym}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={symptomDetail}
            onChange={(e) => setSymptomDetail(e.target.value)}
            placeholder="补充症状描述（如：夜间偶有鼻音、耳后有小红点）"
            className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input mt-2"
          />
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-[#3F302D]">用药 / 物理降温记录（可选）</span>
          <input
            type="text"
            value={medication}
            onChange={(e) => setMedication(e.target.value)}
            placeholder="例如：海盐水洗鼻、遵医嘱服用退热滴剂 1.5ml"
            className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-[#3F302D]">护理备注（可选）</span>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="精神状态、进食饮水与睡眠情况…"
            className="w-full p-3.5 text-sm sketch-input resize-y"
          />
        </label>

        <PhotoUploader
          images={images}
          onChange={setImages}
          multiple
          label="照片附件（如处方单、皮疹记录，可选）"
        />

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
            {saving ? '保存中…' : '保存护理记录'}
          </button>
        </div>
      </form>
    </div>
  );
};
