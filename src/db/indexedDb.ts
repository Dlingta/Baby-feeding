import type {
  BabyJournalExportPayload,
  BabyProfile,
  DiaryEntry,
  FeedingEntry,
  GrowthEntry,
  IllnessEntry,
  VaccineRecord,
} from '../types/baby';

const DB_NAME = 'xiaohe_baby_journal_db';
const DB_VERSION = 1;

const STORES = {
  profile: 'profile',
  diaries: 'diaries',
  feedings: 'feedings',
  growth: 'growth',
  vaccineRecords: 'vaccineRecords',
  illnesses: 'illnesses',
  preferences: 'preferences',
} as const;

export const DEFAULT_RECORDERS = ['妈妈', '爸爸', '祖辈', '保姆', '其他'];

export function createDefaultProfile(): BabyProfile {
  return {
    id: 'default',
    name: '',
    birthDate: '',
    recorders: [...DEFAULT_RECORDERS],
    updatedAt: new Date().toISOString(),
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('当前浏览器不支持 IndexedDB 本地存储'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.profile)) {
        db.createObjectStore(STORES.profile, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.diaries)) {
        db.createObjectStore(STORES.diaries, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.feedings)) {
        db.createObjectStore(STORES.feedings, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.growth)) {
        db.createObjectStore(STORES.growth, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.vaccineRecords)) {
        db.createObjectStore(STORES.vaccineRecords, { keyPath: 'vaccineId' });
      }
      if (!db.objectStoreNames.contains(STORES.illnesses)) {
        db.createObjectStore(STORES.illnesses, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.preferences)) {
        db.createObjectStore(STORES.preferences, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('打开本地数据库失败'));
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error ?? new Error(`读取 ${storeName} 失败`));
  });
}

async function getByKey<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new Error(`读取 ${storeName} 记录失败`));
  });
}

async function putInStore<T>(storeName: string, item: T): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error(`保存 ${storeName} 失败`));
  });
}

async function deleteFromStore(storeName: string, key: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error(`删除 ${storeName} 失败`));
  });
}

export interface LoadedJournalState {
  profile: BabyProfile;
  diaries: DiaryEntry[];
  feedings: FeedingEntry[];
  growth: GrowthEntry[];
  vaccineRecords: VaccineRecord[];
  illnesses: IllnessEntry[];
  checkedEarlyLearningIds: string[];
}

export async function loadAllJournalData(): Promise<LoadedJournalState> {
  const [rawProfile, diaries, feedings, growth, vaccineRecords, illnesses, checkedPref] =
    await Promise.all([
      getByKey<BabyProfile>(STORES.profile, 'default'),
      getAllFromStore<DiaryEntry>(STORES.diaries),
      getAllFromStore<FeedingEntry>(STORES.feedings),
      getAllFromStore<GrowthEntry>(STORES.growth),
      getAllFromStore<VaccineRecord>(STORES.vaccineRecords),
      getAllFromStore<IllnessEntry>(STORES.illnesses),
      getByKey<{ key: string; value: string[] }>(STORES.preferences, 'checkedEarlyLearningIds'),
    ]);

  const profile = rawProfile
    ? {
        ...rawProfile,
        recorders:
          rawProfile.recorders && rawProfile.recorders.length > 0
            ? rawProfile.recorders
            : [...DEFAULT_RECORDERS],
      }
    : createDefaultProfile();

  return {
    profile,
    diaries,
    feedings,
    growth,
    vaccineRecords,
    illnesses,
    checkedEarlyLearningIds: checkedPref?.value ?? [],
  };
}

export async function saveProfile(profile: BabyProfile): Promise<void> {
  await putInStore(STORES.profile, profile);
}

export async function saveDiaryEntry(entry: DiaryEntry): Promise<void> {
  await putInStore(STORES.diaries, entry);
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  await deleteFromStore(STORES.diaries, id);
}

export async function saveFeedingEntry(entry: FeedingEntry): Promise<void> {
  await putInStore(STORES.feedings, entry);
}

export async function deleteFeedingEntry(id: string): Promise<void> {
  await deleteFromStore(STORES.feedings, id);
}

export async function saveGrowthEntry(entry: GrowthEntry): Promise<void> {
  await putInStore(STORES.growth, entry);
}

export async function deleteGrowthEntry(id: string): Promise<void> {
  await deleteFromStore(STORES.growth, id);
}

export async function saveVaccineRecord(record: VaccineRecord): Promise<void> {
  await putInStore(STORES.vaccineRecords, record);
}

export async function deleteVaccineRecord(vaccineId: string): Promise<void> {
  await deleteFromStore(STORES.vaccineRecords, vaccineId);
}

export async function saveIllnessEntry(entry: IllnessEntry): Promise<void> {
  await putInStore(STORES.illnesses, entry);
}

export async function deleteIllnessEntry(id: string): Promise<void> {
  await deleteFromStore(STORES.illnesses, id);
}

export async function saveCheckedEarlyLearningIds(ids: string[]): Promise<void> {
  await putInStore(STORES.preferences, {
    key: 'checkedEarlyLearningIds',
    value: ids,
  });
}

export async function buildExportPayload(): Promise<BabyJournalExportPayload> {
  const data = await loadAllJournalData();
  return {
    schemaVersion: '1.0.0',
    app: 'xiaohe-baby-journal',
    exportedAt: new Date().toISOString(),
    source: 'indexeddb-local',
    profile: data.profile,
    diaries: data.diaries,
    feedings: data.feedings,
    growth: data.growth,
    vaccineRecords: data.vaccineRecords,
    illnesses: data.illnesses,
    checkedEarlyLearningIds: data.checkedEarlyLearningIds,
  };
}

export async function importJournalPayload(payload: BabyJournalExportPayload): Promise<void> {
  if (!payload || payload.schemaVersion !== '1.0.0') {
    throw new Error('备份文件格式不匹配，请选择有效的 JSON 导出文件');
  }

  const db = await openDatabase();
  const storeNames = [
    STORES.profile,
    STORES.diaries,
    STORES.feedings,
    STORES.growth,
    STORES.vaccineRecords,
    STORES.illnesses,
    STORES.preferences,
  ];

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeNames, 'readwrite');
    for (const name of storeNames) {
      tx.objectStore(name).clear();
    }
    if (payload.profile) {
      tx.objectStore(STORES.profile).put({
        ...payload.profile,
        id: 'default',
      });
    }
    for (const item of payload.diaries ?? []) {
      tx.objectStore(STORES.diaries).put(item);
    }
    for (const item of payload.feedings ?? []) {
      tx.objectStore(STORES.feedings).put(item);
    }
    for (const item of payload.growth ?? []) {
      tx.objectStore(STORES.growth).put(item);
    }
    for (const item of payload.vaccineRecords ?? []) {
      tx.objectStore(STORES.vaccineRecords).put(item);
    }
    for (const item of payload.illnesses ?? []) {
      tx.objectStore(STORES.illnesses).put(item);
    }
    tx.objectStore(STORES.preferences).put({
      key: 'checkedEarlyLearningIds',
      value: payload.checkedEarlyLearningIds ?? [],
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('导入备份数据失败'));
  });
}
