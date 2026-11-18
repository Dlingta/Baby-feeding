export type AppTab = 'home' | 'diary' | 'feeding' | 'growth' | 'health' | 'settings';

export interface MediaAttachment {
  id: string;
  dataUrl: string;
  name: string;
  mimeType: string;
}

export interface BabyProfile {
  id: 'default';
  name: string;
  birthDate: string; // YYYY-MM-DD
  recorders: string[];
  updatedAt: string;
}

export type DiaryMood = '开心' | '哭闹' | '安静' | '闹腾' | '熟睡' | '其他';
export type DiaryWeather = '晴天' | '多云' | '阴天' | '小雨' | '大风' | '雪天';

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  recorder: string;
  mood: DiaryMood;
  weather?: DiaryWeather;
  content: string;
  images: MediaAttachment[];
  createdAt: string;
  updatedAt: string;
}

export type FeedingType = 'breast' | 'formula' | 'other';

export interface FeedingEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: FeedingType;
  durationMinutes?: number; // for breast
  amountMl?: number; // for formula
  otherValue?: string; // for water/other (amount or short description)
  note: string;
  images: MediaAttachment[];
  recorder: string;
  isOcrDraftReviewed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GrowthMetric = 'heightCm' | 'weightKg' | 'headCm';

export interface GrowthEntry {
  id: string;
  date: string; // YYYY-MM-DD
  heightCm?: number;
  weightKg?: number;
  headCm?: number;
  recorder: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaccinePreset {
  id: string;
  name: string;
  doseLabel: string;
  targetMonths: number;
  ageLabel: string;
  note: string;
}

export interface VaccineRecord {
  vaccineId: string;
  completed: boolean;
  actualDate?: string; // YYYY-MM-DD
  recorder?: string;
  note?: string;
  updatedAt: string;
}

export interface IllnessEntry {
  id: string;
  date: string; // YYYY-MM-DD
  temperature?: number;
  symptoms: string[];
  symptomDetail?: string;
  medication?: string;
  note?: string;
  images: MediaAttachment[];
  recorder: string;
  createdAt: string;
  updatedAt: string;
}

export interface EarlyLearningStage {
  id: string;
  minMonths: number;
  maxMonths: number;
  stageLabel: string;
  focusTitle: string;
  tips: Array<{
    id: string;
    title: string;
    detail: string;
  }>;
}

export interface BabyJournalExportPayload {
  schemaVersion: '1.0.0';
  app: 'xiaohe-baby-journal';
  exportedAt: string;
  source: 'indexeddb-local';
  profile: BabyProfile | null;
  diaries: DiaryEntry[];
  feedings: FeedingEntry[];
  growth: GrowthEntry[];
  vaccineRecords: VaccineRecord[];
  illnesses: IllnessEntry[];
  checkedEarlyLearningIds: string[];
}
