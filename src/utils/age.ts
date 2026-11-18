import { EARLY_LEARNING_STAGES } from '../data/presets';
import type { EarlyLearningStage } from '../types/baby';

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getNowTimeHHMM(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function parseISODate(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

export function shiftISODate(dateStr: string, offsetDays: number): string {
  const dt = parseISODate(dateStr) ?? new Date();
  dt.setDate(dt.getDate() + offsetDays);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addMonthsToISO(dateStr: string, months: number): string | null {
  const dt = parseISODate(dateStr);
  if (!dt) return null;
  const targetDay = dt.getDate();
  const result = new Date(dt.getFullYear(), dt.getMonth() + months, 1);
  const lastDayOfTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(targetDay, lastDayOfTargetMonth));
  const y = result.getFullYear();
  const m = String(result.getMonth() + 1).padStart(2, '0');
  const d = String(result.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diffDaysBetween(fromDateStr: string, toDateStr: string): number | null {
  const from = parseISODate(fromDateStr);
  const to = parseISODate(toDateStr);
  if (!from || !to) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

export interface BabyAgeCalculation {
  valid: boolean;
  error?: string;
  dayNumber: number; // 第 N 天 (出生当天为第 1 天)
  weekNumber: number; // 第 N 周
  months: number; // 整月数
  remDays: number; // 余下天数
  monthAgeLabel: string; // e.g. "3个月12天"
}

export function calculateBabyAge(
  birthDateStr: string,
  targetDateStr: string = getTodayISO()
): BabyAgeCalculation {
  if (!birthDateStr) {
    return {
      valid: false,
      error: '尚未填写宝宝出生日期',
      dayNumber: 0,
      weekNumber: 0,
      months: 0,
      remDays: 0,
      monthAgeLabel: '—',
    };
  }

  const birth = parseISODate(birthDateStr);
  const target = parseISODate(targetDateStr);
  if (!birth || !target) {
    return {
      valid: false,
      error: '日期格式有误，请重新选择出生日期',
      dayNumber: 0,
      weekNumber: 0,
      months: 0,
      remDays: 0,
      monthAgeLabel: '—',
    };
  }

  const diffDays = diffDaysBetween(birthDateStr, targetDateStr);
  if (diffDays === null || diffDays < 0) {
    return {
      valid: false,
      error: '所选日期早于宝宝出生日期，无法计算天数',
      dayNumber: 0,
      weekNumber: 0,
      months: 0,
      remDays: 0,
      monthAgeLabel: '—',
    };
  }

  const dayNumber = diffDays + 1;
  const weekNumber = Math.max(1, Math.ceil(dayNumber / 7));

  let months =
    (target.getFullYear() - birth.getFullYear()) * 12 +
    (target.getMonth() - birth.getMonth());
  let remDays = target.getDate() - birth.getDate();

  if (remDays < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    remDays = prevMonthLastDay - birth.getDate() + target.getDate();
  }

  months = Math.max(0, months);
  remDays = Math.max(0, remDays);

  const monthAgeLabel =
    months === 0
      ? `满月前 · ${remDays}天`
      : remDays === 0
        ? `${months}月龄`
        : `${months}个月${remDays}天`;

  return {
    valid: true,
    dayNumber,
    weekNumber,
    months,
    remDays,
    monthAgeLabel,
  };
}

export function getEarlyLearningStageForMonths(months: number): EarlyLearningStage {
  const match = EARLY_LEARNING_STAGES.find(
    (s) => months >= s.minMonths && months <= s.maxMonths
  );
  return match ?? EARLY_LEARNING_STAGES[0];
}

export function formatChineseDate(dateStr: string): string {
  const dt = parseISODate(dateStr);
  if (!dt) return dateStr;
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const m = dt.getMonth() + 1;
  const d = dt.getDate();
  const w = weekdays[dt.getDay()];
  return `${dt.getFullYear()}年${m}月${d}日 · ${w}`;
}

export function formatShortDate(dateStr: string): string {
  const dt = parseISODate(dateStr);
  if (!dt) return dateStr;
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}
