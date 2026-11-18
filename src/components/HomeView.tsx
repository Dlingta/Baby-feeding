import React, { useMemo } from 'react';
import {
  Baby,
  BookOpen,
  Check,
  ChevronRight,
  Milk,
  Ruler,
  Settings,
  ShieldPlus,
  Syringe,
} from 'lucide-react';
import { CHINA_VACCINE_SCHEDULE } from '../data/presets';
import type {
  AppTab,
  BabyProfile,
  DiaryEntry,
  FeedingEntry,
  GrowthEntry,
  VaccineRecord,
} from '../types/baby';
import {
  addMonthsToISO,
  calculateBabyAge,
  diffDaysBetween,
  formatChineseDate,
  getEarlyLearningStageForMonths,
  getTodayISO,
} from '../utils/age';
import { HandDrawnDivider, StorybookCloud, StorybookFlower } from './SketchPrimitives';

interface HomeViewProps {
  profile: BabyProfile;
  diaries: DiaryEntry[];
  feedings: FeedingEntry[];
  growth: GrowthEntry[];
  vaccineRecords: VaccineRecord[];
  checkedEarlyLearningIds: string[];
  onToggleEarlyLearning: (id: string) => void;
  onNavigate: (tab: AppTab, quickAction?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  diaries,
  feedings,
  growth,
  vaccineRecords,
  checkedEarlyLearningIds,
  onToggleEarlyLearning,
  onNavigate,
}) => {
  const today = getTodayISO();
  const age = useMemo(() => calculateBabyAge(profile.birthDate, today), [profile.birthDate, today]);

  const todaySummary = useMemo(() => {
    const todayDiaries = diaries.filter((d) => d.date === today);
    const todayFeedings = feedings.filter((f) => f.date === today);
    const todayGrowth = growth.filter((g) => g.date === today);

    return {
      diaryCount: todayDiaries.length,
      feedingCount: todayFeedings.length,
      hasGrowth: todayGrowth.length > 0,
    };
  }, [diaries, feedings, growth, today]);

  const nextVaccineInfo = useMemo(() => {
    const completedSet = new Set(
      vaccineRecords.filter((r) => r.completed).map((r) => r.vaccineId)
    );
    const nextPreset = CHINA_VACCINE_SCHEDULE.find((v) => !completedSet.has(v.id));
    if (!nextPreset) {
      return { allDone: true as const };
    }
    if (!age.valid || !profile.birthDate) {
      return {
        allDone: false as const,
        preset: nextPreset,
        dueDate: null,
        daysUntil: null,
      };
    }
    const dueDate = addMonthsToISO(profile.birthDate, nextPreset.targetMonths);
    const daysUntil = dueDate ? diffDaysBetween(today, dueDate) : null;
    return {
      allDone: false as const,
      preset: nextPreset,
      dueDate,
      daysUntil,
    };
  }, [vaccineRecords, age.valid, profile.birthDate, today]);

  const currentStage = useMemo(
    () => getEarlyLearningStageForMonths(age.valid ? age.months : 0),
    [age.valid, age.months]
  );

  const quickEntries: Array<{
    id: AppTab;
    action: string;
    title: string;
    subtitle: string;
    bgClass: string;
    iconBg: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'diary',
      action: 'new-diary',
      title: '记日记',
      subtitle: '语音与图文留念',
      bgClass: 'sketch-card-wash-blue',
      iconBg: 'bg-[#5B92B8] text-[#FCF8EC]',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: 'feeding',
      action: 'new-feeding',
      title: '记喂养',
      subtitle: '母乳 · 奶粉 · 识图',
      bgClass: 'sketch-card-wash-sage',
      iconBg: 'bg-[#7A8F36] text-[#FCF8EC]',
      icon: <Milk className="w-5 h-5" />,
    },
    {
      id: 'growth',
      action: 'new-growth',
      title: '记成长',
      subtitle: '身高 · 体重 · 头围',
      bgClass: 'sketch-card-wash-ochre',
      iconBg: 'bg-[#EBC148] text-[#3F302D]',
      icon: <Ruler className="w-5 h-5" />,
    },
    {
      id: 'health',
      action: 'view-health',
      title: '健康簿',
      subtitle: '疫苗 · 体温护理',
      bgClass: 'sketch-card-wash-red',
      iconBg: 'bg-[#D64E38] text-[#FCF8EC]',
      icon: <ShieldPlus className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Storybook Hero Card without black edges */}
      <section className="sketch-card overflow-hidden">
        <div className="h-2.5 w-full gingham-strip" aria-hidden="true" />
        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
          <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-[#755F5C] tabular-nums">
                  {formatChineseDate(today)}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('settings')}
                  className="min-h-[40px] px-3 py-1.5 text-xs font-bold text-[#3F302D] bg-[#FBF0C9] hover:bg-[#F5E2A0] border border-[#D6A53A]/35 rounded-[11px] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  档案设置
                </button>
              </div>

              {profile.name ? (
                <h1 className="text-2xl sm:text-3xl font-bold text-[#3F302D] tracking-tight flex items-center gap-2">
                  <span>{profile.name}的小绘本</span>
                  <StorybookFlower className="w-6 h-6 shrink-0" />
                </h1>
              ) : (
                <h1 className="text-2xl sm:text-3xl font-bold text-[#3F302D] tracking-tight flex items-center gap-2">
                  <span>欢迎来到小禾手账</span>
                  <StorybookFlower className="w-6 h-6 shrink-0" />
                </h1>
              )}

              {age.valid ? (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-1 text-[#3F302D]">
                  <span className="text-xl sm:text-2xl font-bold tabular-nums text-[#D64E38]">
                    第 {age.dayNumber} 天
                  </span>
                  <span className="text-[#755F5C]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-base font-bold tabular-nums text-[#4D7FA3]">
                    第 {age.weekNumber} 周
                  </span>
                  <span className="text-[#755F5C]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-base font-bold tabular-nums">{age.monthAgeLabel}</span>
                </div>
              ) : (
                <div className="pt-1 space-y-2.5">
                  <p className="text-sm text-[#755F5C] leading-relaxed">
                    {age.error ?? '设置宝宝姓名与出生日期后，将自动计算出生天数、周数、月龄与疫苗排期。'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('settings')}
                    className="min-h-[44px] px-5 py-2.5 text-sm font-bold sketch-btn-primary inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Baby className="w-4 h-4" />
                    完善宝宝档案
                  </button>
                </div>
              )}
            </div>

            <HandDrawnDivider />

            {/* Today's Summary */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-[#755F5C]">当日摘要</div>
              <div className="grid grid-cols-3 gap-2.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => onNavigate('diary')}
                  className="text-left p-2.5 rounded-[13px] bg-[#E2EFF7] border border-[#5B92B8]/25 hover:translate-y-[-1px] transition-transform cursor-pointer"
                >
                  <div className="text-xs font-semibold text-[#3F302D]">日记</div>
                  <div className="text-lg font-bold text-[#3F302D] tabular-nums mt-0.5">
                    {todaySummary.diaryCount} <span className="text-xs font-normal">篇</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('feeding')}
                  className="text-left p-2.5 rounded-[13px] bg-[#EBF0D1] border border-[#7A8F36]/25 hover:translate-y-[-1px] transition-transform cursor-pointer"
                >
                  <div className="text-xs font-semibold text-[#3F302D]">喂养</div>
                  <div className="text-lg font-bold text-[#3F302D] tabular-nums mt-0.5">
                    {todaySummary.feedingCount} <span className="text-xs font-normal">次</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('growth')}
                  className="text-left p-2.5 rounded-[13px] bg-[#FCF2D2] border border-[#D6A53A]/25 hover:translate-y-[-1px] transition-transform cursor-pointer"
                >
                  <div className="text-xs font-semibold text-[#3F302D]">今日成长</div>
                  <div
                    className={`text-sm font-bold mt-1.5 ${
                      todaySummary.hasGrowth ? 'text-[#6B7F30]' : 'text-[#755F5C]'
                    }`}
                  >
                    {todaySummary.hasGrowth ? '已记录' : '未记录'}
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 relative bg-[#E2EFF7] border-t md:border-t-0 md:border-l border-[#9A7276]/20 flex items-center justify-center overflow-hidden">
            <StorybookCloud className="w-16 h-10 absolute top-3 left-3 pointer-events-none opacity-95" />
            <img
              src="/assets/aistudio/_____20261118103450_29_2_b8788ebd.jpg"
              alt="手绘复古绘本风格小兔与小熊草地野餐插画"
              referrerPolicy="no-referrer"
              className="w-full h-52 sm:h-60 md:h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Four Quick Entrances */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-[#3F302D]">快捷记录</h2>
          <span className="text-xs font-medium text-[#755F5C]">点按即刻新建</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {quickEntries.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id, item.action)}
              className={`${item.bgClass} p-4 text-left flex flex-col justify-between gap-3 min-h-[108px] hover:translate-y-[-1.5px] active:scale-[0.98] transition-all cursor-pointer`}
            >
              <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${item.iconBg}`}>
                {item.icon}
              </div>
              <div>
                <div className="text-base font-bold text-[#3F302D]">{item.title}</div>
                <div className="text-xs text-[#755F5C] mt-0.5 font-medium">{item.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Two-Column Split on Desktop: Next Vaccine + Early Learning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Next Vaccine Card */}
        <section className="lg:col-span-5 sketch-card p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[11px] bg-[#FBE5E0] text-[#D64E38] flex items-center justify-center shrink-0">
                <Syringe className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#3F302D]">下一针疫苗提醒</h2>
                <p className="text-xs text-[#755F5C]">基于国内常规免疫参考表</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('health')}
              className="min-h-[40px] px-2.5 text-xs font-bold text-[#4D7FA3] hover:underline flex items-center gap-0.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              查看全部
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {nextVaccineInfo.allDone ? (
            <div className="p-4 rounded-[15px] bg-[#EBF0D1] text-[#3F302D] text-sm font-medium">
              常规免疫规划表中的 19 剂次已全部打卡完成。
            </div>
          ) : (
            <div className="p-4 rounded-[15px] bg-[#FCF2D2] stitched-frame space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-[#3F302D]">
                    {nextVaccineInfo.preset.name} · {nextVaccineInfo.preset.doseLabel}
                  </div>
                  <div className="text-xs text-[#755F5C] mt-0.5 tabular-nums font-medium">
                    建议月龄：{nextVaccineInfo.preset.ageLabel}
                    {nextVaccineInfo.dueDate ? ` · 预计 ${nextVaccineInfo.dueDate}` : ''}
                  </div>
                </div>
                {nextVaccineInfo.daysUntil !== null ? (
                  <span
                    className={`text-sm font-bold tabular-nums whitespace-nowrap shrink-0 ${
                      nextVaccineInfo.daysUntil <= 7 ? 'text-[#D64E38]' : 'text-[#4D7FA3]'
                    }`}
                  >
                    {nextVaccineInfo.daysUntil > 0
                      ? `还有 ${nextVaccineInfo.daysUntil} 天`
                      : nextVaccineInfo.daysUntil === 0
                        ? '今日可接种'
                        : `已超期 ${Math.abs(nextVaccineInfo.daysUntil)} 天`}
                  </span>
                ) : (
                  <span className="text-xs text-[#D64E38] font-bold whitespace-nowrap shrink-0">
                    待填出生日期
                  </span>
                )}
              </div>
              <p className="text-xs text-[#755F5C] leading-relaxed">
                {nextVaccineInfo.preset.note}
              </p>
            </div>
          )}
        </section>

        {/* Early Learning Checklist */}
        <section className="lg:col-span-7 sketch-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#3F302D]">
                当前月龄早教建议（{currentStage.stageLabel}）
              </h2>
              <p className="text-xs text-[#755F5C] mt-0.5">
                阶段重点：{currentStage.focusTitle} · 静态预置清单
              </p>
            </div>
            <span className="text-xs font-bold text-[#4D7FA3] tabular-nums">
              已互动 {currentStage.tips.filter((t) => checkedEarlyLearningIds.includes(t.id)).length} /{' '}
              {currentStage.tips.length}
            </span>
          </div>

          <div className="divide-y divide-[#9A7276]/15">
            {currentStage.tips.map((tip) => {
              const checked = checkedEarlyLearningIds.includes(tip.id);
              return (
                <button
                  key={tip.id}
                  type="button"
                  onClick={() => onToggleEarlyLearning(tip.id)}
                  className="w-full py-3 first:pt-1 last:pb-1 flex items-start gap-3 text-left group cursor-pointer"
                >
                  <span
                    className={`mt-0.5 w-6 h-6 rounded-[7px_9px_7px_8px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                      checked
                        ? 'bg-[#8DA143] border-[#8DA143] text-[#FCF8EC]'
                        : 'bg-[#FCF8EC] border-[#9A7276]/45 group-hover:bg-[#FCF2D2]'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5 stroke-[2.8]" />}
                  </span>
                  <div className="space-y-0.5">
                    <div
                      className={`text-sm font-bold transition-colors ${
                        checked ? 'text-[#755F5C] line-through' : 'text-[#3F302D]'
                      }`}
                    >
                      {tip.title}
                    </div>
                    <p className="text-xs text-[#755F5C] leading-relaxed">{tip.detail}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
