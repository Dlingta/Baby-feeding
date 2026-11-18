import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Download, Plus, Upload, X } from 'lucide-react';
import { DEFAULT_RECORDERS, buildExportPayload, importJournalPayload } from '../db/indexedDb';
import type { BabyJournalExportPayload, BabyProfile } from '../types/baby';
import { calculateBabyAge, getTodayISO } from '../utils/age';

interface SettingsViewProps {
  profile: BabyProfile;
  counts: {
    diaries: number;
    feedings: number;
    growth: number;
    vaccines: number;
    illnesses: number;
  };
  onSaveProfile: (profile: BabyProfile) => Promise<void>;
  onRefreshAll: () => Promise<void>;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  counts,
  onSaveProfile,
  onRefreshAll,
  onBack,
}) => {
  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [recorders, setRecorders] = useState<string[]>(
    profile.recorders.length > 0 ? profile.recorders : [...DEFAULT_RECORDERS]
  );
  const [newRecorder, setNewRecorder] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const today = getTodayISO();
  const agePreview = useMemo(() => calculateBabyAge(birthDate, today), [birthDate, today]);

  const handleAddRecorder = () => {
    const trimmed = newRecorder.trim();
    if (!trimmed) return;
    if (recorders.includes(trimmed)) {
      setFeedback({ type: 'error', text: `记录人“${trimmed}”已在列表中` });
      return;
    }
    setRecorders([...recorders, trimmed]);
    setNewRecorder('');
    setFeedback(null);
  };

  const handleRemoveRecorder = (target: string) => {
    if (recorders.length <= 1) {
      setFeedback({ type: 'error', text: '至少需要保留一位常用记录人' });
      return;
    }
    setRecorders(recorders.filter((r) => r !== target));
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFeedback({ type: 'error', text: '请先填写宝宝姓名或小名' });
      return;
    }
    if (!birthDate) {
      setFeedback({ type: 'error', text: '请选择宝宝出生日期' });
      return;
    }
    if (!agePreview.valid) {
      setFeedback({
        type: 'error',
        text: agePreview.error ?? '出生日期不能晚于今天，请检查后重试',
      });
      return;
    }

    setSaving(true);
    try {
      await onSaveProfile({
        id: 'default',
        name: trimmedName,
        birthDate,
        recorders,
        updatedAt: new Date().toISOString(),
      });
      onBack();
    } catch {
      setFeedback({ type: 'error', text: '保存失败，请检查浏览器本地存储权限' });
      setSaving(false);
    }
  };

  const handleExportJson = async () => {
    try {
      const payload = await buildExportPayload();
      const jsonText = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileSlug = (name.trim() || 'baby').replace(/[^\w\u4e00-\u9fa5-]/g, '');
      link.href = url;
      link.download = `小禾手账_${fileSlug}_${today}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback({
        type: 'success',
        text: '已导出标准 JSON 数据包（schemaVersion 1.0.0），可用于本地备份或后续云端迁移。',
      });
    } catch {
      setFeedback({ type: 'error', text: '导出 JSON 文件失败，请稍后重试' });
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BabyJournalExportPayload;
      await importJournalPayload(parsed);
      await onRefreshAll();
      if (parsed.profile) {
        setName(parsed.profile.name);
        setBirthDate(parsed.profile.birthDate);
        setRecorders(
          parsed.profile.recorders?.length ? parsed.profile.recorders : [...DEFAULT_RECORDERS]
        );
      }
      setFeedback({ type: 'success', text: '已从 JSON 备份恢复全部手账记录' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : '导入失败，请确认文件为有效的 JSON 备份',
      });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 py-2 text-sm font-semibold text-[#3F302D] hover:bg-[#F4D3D8]/60 rounded-[12px] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </button>
        <h1 className="text-xl font-bold text-[#3F302D]">档案与设置</h1>
        <div className="w-20" />
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-[15px] text-sm font-medium flex items-start gap-2.5 border ${
            feedback.type === 'success'
              ? 'bg-[#EBF0D1] border-[#7A8F36]/30 text-[#3F302D]'
              : 'bg-[#FBE5E0] border-[#D64E38]/30 text-[#8B2718]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Baby Info & Age Preview */}
      <form onSubmit={handleSubmit} className="sketch-card p-5 sm:p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#3F302D]">宝宝基本信息</h2>
          <p className="text-xs text-[#755F5C]">保存后自动计算出生天数、周数与月龄</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-[#3F302D]">宝宝姓名 / 小名</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：小禾、糖豆"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-[#3F302D]">出生日期</span>
            <input
              type="date"
              max={today}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input tabular-nums"
            />
          </label>
        </div>

        {/* Live Calculation Preview */}
        <div className="p-4 rounded-[15px] bg-[#FCF2D2] stitched-frame">
          {agePreview.valid ? (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-[#755F5C]">出生天数</div>
                <div className="text-lg font-bold text-[#D64E38] tabular-nums mt-0.5">
                  第 {agePreview.dayNumber} 天
                </div>
              </div>
              <div>
                <div className="text-xs text-[#755F5C]">出生周数</div>
                <div className="text-lg font-bold text-[#4D7FA3] tabular-nums mt-0.5">
                  第 {agePreview.weekNumber} 周
                </div>
              </div>
              <div>
                <div className="text-xs text-[#755F5C]">当前月龄</div>
                <div className="text-base font-bold text-[#3F302D] tabular-nums mt-1">
                  {agePreview.monthAgeLabel}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#755F5C] text-center">
              {agePreview.error ?? '请选择有效的出生日期以预览计算结果'}
            </p>
          )}
        </div>

        {/* Recorders Maintenance */}
        <div className="space-y-3 pt-1">
          <div>
            <h3 className="text-sm font-bold text-[#3F302D]">常用记录人列表</h3>
            <p className="text-xs text-[#755F5C] mt-0.5">
              记日记、喂养、成长或健康数据时可随时独立选择，不绑定固定账号。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {recorders.map((person) => (
              <div
                key={person}
                className="inline-flex items-center gap-1.5 pl-3.5 pr-2 py-1.5 min-h-[40px] rounded-[12px] bg-[#F6E7E9] border border-[#9A7276]/25 text-sm font-semibold text-[#3F302D]"
              >
                <span>{person}</span>
                <button
                  type="button"
                  aria-label={`删除记录人 ${person}`}
                  onClick={() => handleRemoveRecorder(person)}
                  className="w-6 h-6 rounded-full hover:bg-[#3F302D]/10 flex items-center justify-center text-[#755F5C] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newRecorder}
              onChange={(e) => setNewRecorder(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRecorder();
                }
              }}
              placeholder="新增常用记录人，如：外婆、阿姨"
              className="flex-1 min-h-[44px] px-3.5 py-2 text-sm sketch-input"
            />
            <button
              type="button"
              onClick={handleAddRecorder}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold sketch-btn-secondary inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[48px] text-sm font-bold sketch-btn-primary cursor-pointer"
        >
          {saving ? '正在保存…' : '保存并回到主页'}
        </button>
      </form>

      {/* Data Backup & Cloud Migration JSON Export */}
      <section className="sketch-card p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#3F302D]">本地数据管理与 JSON 导出</h2>
          <p className="text-xs text-[#755F5C] leading-relaxed">
            所有文字与照片均保存在当前设备浏览器 IndexedDB 中，无任何外部服务器上传。导出的结构化 JSON 文件（含 schemaVersion）可直接备份或用于后续云端迁移。
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center p-3 rounded-[14px] bg-[#FBE3E6]/55 border border-[#9A7276]/20">
          <div>
            <div className="text-xs text-[#755F5C]">日记</div>
            <div className="text-base font-bold text-[#3F302D] tabular-nums">{counts.diaries}</div>
          </div>
          <div>
            <div className="text-xs text-[#755F5C]">喂养</div>
            <div className="text-base font-bold text-[#3F302D] tabular-nums">{counts.feedings}</div>
          </div>
          <div>
            <div className="text-xs text-[#755F5C]">成长</div>
            <div className="text-base font-bold text-[#3F302D] tabular-nums">{counts.growth}</div>
          </div>
          <div>
            <div className="text-xs text-[#755F5C]">疫苗打卡</div>
            <div className="text-base font-bold text-[#3F302D] tabular-nums">{counts.vaccines}</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-xs text-[#755F5C]">生病护理</div>
            <div className="text-base font-bold text-[#3F302D] tabular-nums">{counts.illnesses}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex-1 min-h-[46px] px-4 py-2.5 text-sm font-bold sketch-btn-primary inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            导出全部 JSON 数据
          </button>

          <label className="flex-1 min-h-[46px] px-4 py-2.5 text-sm font-semibold sketch-btn-secondary inline-flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            从 JSON 备份恢复
            <input type="file" accept=".json,application/json" onChange={handleImportJson} className="sr-only" />
          </label>
        </div>
      </section>
    </div>
  );
};
