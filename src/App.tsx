import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Home,
  Milk,
  Ruler,
  Settings,
  ShieldPlus,
} from 'lucide-react';
import { DiaryView } from './components/DiaryView';
import { FeedingView } from './components/FeedingView';
import { GrowthView } from './components/GrowthView';
import { HealthView } from './components/HealthView';
import { HomeView } from './components/HomeView';
import { SettingsView } from './components/SettingsView';
import { StorybookFlower } from './components/SketchPrimitives';
import {
  createDefaultProfile,
  deleteDiaryEntry,
  deleteFeedingEntry,
  deleteGrowthEntry,
  deleteIllnessEntry,
  deleteVaccineRecord,
  loadAllJournalData,
  saveCheckedEarlyLearningIds,
  saveDiaryEntry,
  saveFeedingEntry,
  saveGrowthEntry,
  saveIllnessEntry,
  saveProfile,
  saveVaccineRecord,
} from './db/indexedDb';
import type {
  AppTab,
  BabyProfile,
  DiaryEntry,
  FeedingEntry,
  GrowthEntry,
  IllnessEntry,
  VaccineRecord,
} from './types/baby';

const NAV_ITEMS: Array<{
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'diary', label: '日记', icon: BookOpen },
  { id: 'feeding', label: '喂养', icon: Milk },
  { id: 'growth', label: '成长', icon: Ruler },
  { id: 'health', label: '健康', icon: ShieldPlus },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [quickAction, setQuickAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  const [profile, setProfile] = useState<BabyProfile>(createDefaultProfile());
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [feedings, setFeedings] = useState<FeedingEntry[]>([]);
  const [growth, setGrowth] = useState<GrowthEntry[]>([]);
  const [vaccineRecords, setVaccineRecords] = useState<VaccineRecord[]>([]);
  const [illnesses, setIllnesses] = useState<IllnessEntry[]>([]);
  const [checkedEarlyLearningIds, setCheckedEarlyLearningIds] = useState<string[]>([]);

  const refreshAll = useCallback(async () => {
    try {
      const data = await loadAllJournalData();
      setProfile(data.profile);
      setDiaries(data.diaries);
      setFeedings(data.feedings);
      setGrowth(data.growth);
      setVaccineRecords(data.vaccineRecords);
      setIllnesses(data.illnesses);
      setCheckedEarlyLearningIds(data.checkedEarlyLearningIds);
      setStorageError(null);
    } catch (err) {
      setStorageError(
        err instanceof Error ? err.message : '读取本地 IndexedDB 数据失败，请刷新重试。'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleNavigate = (tab: AppTab, action?: string) => {
    setActiveTab(tab);
    setQuickAction(action ?? null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProfile = async (nextProfile: BabyProfile) => {
    await saveProfile(nextProfile);
    setProfile(nextProfile);
  };

  const handleSaveDiary = async (entry: DiaryEntry) => {
    await saveDiaryEntry(entry);
    setDiaries((prev) => {
      const idx = prev.findIndex((d) => d.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [entry, ...prev];
    });
  };

  const handleDeleteDiary = async (id: string) => {
    await deleteDiaryEntry(id);
    setDiaries((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSaveFeeding = async (entry: FeedingEntry) => {
    await saveFeedingEntry(entry);
    setFeedings((prev) => {
      const idx = prev.findIndex((f) => f.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [entry, ...prev];
    });
  };

  const handleDeleteFeeding = async (id: string) => {
    await deleteFeedingEntry(id);
    setFeedings((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSaveGrowth = async (entry: GrowthEntry) => {
    await saveGrowthEntry(entry);
    setGrowth((prev) => {
      const idx = prev.findIndex((g) => g.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [entry, ...prev];
    });
  };

  const handleDeleteGrowth = async (id: string) => {
    await deleteGrowthEntry(id);
    setGrowth((prev) => prev.filter((g) => g.id !== id));
  };

  const handleSaveVaccineRecord = async (record: VaccineRecord) => {
    await saveVaccineRecord(record);
    setVaccineRecords((prev) => {
      const idx = prev.findIndex((v) => v.vaccineId === record.vaccineId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [...prev, record];
    });
  };

  const handleDeleteVaccineRecord = async (vaccineId: string) => {
    await deleteVaccineRecord(vaccineId);
    setVaccineRecords((prev) => prev.filter((v) => v.vaccineId !== vaccineId));
  };

  const handleSaveIllness = async (entry: IllnessEntry) => {
    await saveIllnessEntry(entry);
    setIllnesses((prev) => {
      const idx = prev.findIndex((i) => i.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [entry, ...prev];
    });
  };

  const handleDeleteIllness = async (id: string) => {
    await deleteIllnessEntry(id);
    setIllnesses((prev) => prev.filter((i) => i.id !== id));
  };

  const handleToggleEarlyLearning = async (id: string) => {
    const next = checkedEarlyLearningIds.includes(id)
      ? checkedEarlyLearningIds.filter((item) => item !== id)
      : [...checkedEarlyLearningIds, id];
    setCheckedEarlyLearningIds(next);
    await saveCheckedEarlyLearningIds(next);
  };

  return (
    <div className="min-h-screen paper-grain-bg text-[#3F302D] flex flex-col">
      {/* Soft Gingham Picnic Trim along top edge without black border */}
      <div className="h-2 w-full gingham-strip" aria-hidden="true" />

      {/* Desktop Top Navigation Bar */}
      <header className="hidden md:flex items-center justify-between gap-8 max-w-5xl w-full mx-auto px-6 py-3.5 border-b border-[#9A7276]/20">
        <button
          type="button"
          onClick={() => handleNavigate('home')}
          className="text-xl font-bold tracking-tight text-[#3F302D] font-editorial inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <StorybookFlower className="w-6 h-6" />
          小禾手账
        </button>

        <nav className="flex items-center gap-6 text-sm font-semibold text-[#755F5C]" aria-label="主导航">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-[2.5px] ${
                  active
                    ? 'text-[#3F302D] border-[#D64E38]'
                    : 'border-transparent hover:text-[#3F302D]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => handleNavigate('settings')}
          className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-[13px] border inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
            activeTab === 'settings'
              ? 'bg-[#D64E38] text-[#FCF8EC] border-[#D64E38] shadow-sm'
              : 'bg-[#FCF8EC] text-[#3F302D] border-[#9A7276]/25 hover:bg-[#FBF0C9] shadow-sm'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          档案与导出
        </button>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-24 md:pb-12">
        {storageError && (
          <div className="mb-4 p-4 rounded-[16px] bg-[#FBE5E0] border border-[#D64E38]/30 text-sm text-[#8B2718]">
            {storageError}
          </div>
        )}

        {loading ? (
          <div className="sketch-card p-8 text-center text-sm font-medium text-[#755F5C]">
            正在翻开宝宝成长绘本…
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                profile={profile}
                diaries={diaries}
                feedings={feedings}
                growth={growth}
                vaccineRecords={vaccineRecords}
                checkedEarlyLearningIds={checkedEarlyLearningIds}
                onToggleEarlyLearning={handleToggleEarlyLearning}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'diary' && (
              <DiaryView
                profile={profile}
                diaries={diaries}
                initialAction={quickAction}
                onConsumeAction={() => setQuickAction(null)}
                onSaveDiary={handleSaveDiary}
                onDeleteDiary={handleDeleteDiary}
              />
            )}

            {activeTab === 'feeding' && (
              <FeedingView
                profile={profile}
                feedings={feedings}
                initialAction={quickAction}
                onConsumeAction={() => setQuickAction(null)}
                onSaveFeeding={handleSaveFeeding}
                onDeleteFeeding={handleDeleteFeeding}
              />
            )}

            {activeTab === 'growth' && (
              <GrowthView
                profile={profile}
                growth={growth}
                initialAction={quickAction}
                onConsumeAction={() => setQuickAction(null)}
                onSaveGrowth={handleSaveGrowth}
                onDeleteGrowth={handleDeleteGrowth}
              />
            )}

            {activeTab === 'health' && (
              <HealthView
                profile={profile}
                vaccineRecords={vaccineRecords}
                illnesses={illnesses}
                onSaveVaccineRecord={handleSaveVaccineRecord}
                onDeleteVaccineRecord={handleDeleteVaccineRecord}
                onSaveIllness={handleSaveIllness}
                onDeleteIllness={handleDeleteIllness}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                profile={profile}
                counts={{
                  diaries: diaries.length,
                  feedings: feedings.length,
                  growth: growth.length,
                  vaccines: vaccineRecords.filter((v) => v.completed).length,
                  illnesses: illnesses.length,
                }}
                onSaveProfile={handleSaveProfile}
                onRefreshAll={refreshAll}
                onBack={() => handleNavigate('home')}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Fixed Bottom Tab Bar */}
      <nav
        aria-label="底部导航"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FCF8EC]/95 backdrop-blur-md border-t border-[#9A7276]/22 pb-safe shadow-[0_-2px_12px_rgba(145,95,102,0.08)]"
      >
        <div className="grid grid-cols-5 items-center h-[60px]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  active ? 'text-[#D64E38]' : 'text-[#755F5C] hover:text-[#3F302D]'
                }`}
              >
                <Icon className={`w-[21px] h-[21px] ${active ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                <span className={`text-[11px] leading-tight ${active ? 'font-bold' : 'font-semibold'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
