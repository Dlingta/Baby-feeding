import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Cloud,
  Edit3,
  Mic,
  MicOff,
  Plus,
  Trash2,
} from 'lucide-react';
import { DIARY_MOODS, DIARY_WEATHERS } from '../data/presets';
import type {
  BabyProfile,
  DiaryEntry,
  DiaryMood,
  DiaryWeather,
  MediaAttachment,
} from '../types/baby';
import { calculateBabyAge, formatChineseDate, getTodayISO } from '../utils/age';
import { generateId } from '../utils/media';
import {
  ConfirmDeleteDialog,
  HandDrawnDivider,
  PhotoLightbox,
  PhotoUploader,
  RecorderPicker,
} from './SketchPrimitives';

interface DiaryViewProps {
  profile: BabyProfile;
  diaries: DiaryEntry[];
  initialAction?: string | null;
  onConsumeAction?: () => void;
  onSaveDiary: (entry: DiaryEntry) => Promise<void>;
  onDeleteDiary: (id: string) => Promise<void>;
}

type DiaryMode =
  | { kind: 'list' }
  | { kind: 'detail'; entryId: string }
  | { kind: 'form'; editing?: DiaryEntry };

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

export const DiaryView: React.FC<DiaryViewProps> = ({
  profile,
  diaries,
  initialAction,
  onConsumeAction,
  onSaveDiary,
  onDeleteDiary,
}) => {
  const [mode, setMode] = useState<DiaryMode>({ kind: 'list' });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<MediaAttachment | null>(null);

  useEffect(() => {
    if (initialAction === 'new-diary') {
      setMode({ kind: 'form' });
      onConsumeAction?.();
    }
  }, [initialAction, onConsumeAction]);

  const sortedDiaries = useMemo(
    () =>
      [...diaries].sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [diaries]
  );

  const selectedEntry =
    mode.kind === 'detail'
      ? sortedDiaries.find((d) => d.id === mode.entryId) ?? null
      : null;

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    await onDeleteDiary(id);
    if (mode.kind === 'detail' && mode.entryId === id) {
      setMode({ kind: 'list' });
    }
  };

  if (mode.kind === 'form') {
    return (
      <DiaryForm
        profile={profile}
        editing={mode.editing}
        onCancel={() =>
          mode.editing
            ? setMode({ kind: 'detail', entryId: mode.editing.id })
            : setMode({ kind: 'list' })
        }
        onSave={async (entry) => {
          await onSaveDiary(entry);
          setMode({ kind: 'list' });
        }}
      />
    );
  }

  if (mode.kind === 'detail' && selectedEntry) {
    const entryAge = calculateBabyAge(profile.birthDate, selectedEntry.date);
    const moodMeta = DIARY_MOODS.find((m) => m.value === selectedEntry.mood);

    return (
      <div className="space-y-5 pb-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMode({ kind: 'list' })}
            className="min-h-[44px] px-3 py-2 text-sm font-semibold text-[#3F302D] hover:bg-[#F4D3D8]/60 rounded-[12px] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode({ kind: 'form', editing: selectedEntry })}
              className="min-h-[44px] px-3.5 py-2 text-sm font-semibold sketch-btn-secondary inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              编辑
            </button>
            <button
              type="button"
              onClick={() => setPendingDeleteId(selectedEntry.id)}
              className="min-h-[44px] min-w-[44px] px-3 py-2 text-sm font-bold text-[#D64E38] bg-[#FBE5E0] border border-[#D64E38]/25 hover:bg-[#F5D2CA] rounded-[13px] inline-flex items-center justify-center cursor-pointer"
              aria-label="删除日记"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <article className="sketch-card p-5 sm:p-6 space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#755F5C] tabular-nums font-medium">
              <span className="text-[#3F302D] font-bold">{formatChineseDate(selectedEntry.date)}</span>
              {entryAge.valid && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-[#D64E38]">
                    出生第 {entryAge.dayNumber} 天
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>记录人：{selectedEntry.recorder}</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#3F302D] pt-0.5">
              <span className="inline-flex items-center gap-1.5 font-bold">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: moodMeta?.tone ?? '#8DA143' }}
                />
                心情：{selectedEntry.mood}
              </span>
              {selectedEntry.weather && (
                <>
                  <span className="text-[#755F5C]" aria-hidden="true">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#755F5C] font-medium">
                    <Cloud className="w-3.5 h-3.5" />
                    {selectedEntry.weather}
                  </span>
                </>
              )}
            </div>
          </div>

          <HandDrawnDivider />

          <div className="text-[15px] leading-[1.85] text-[#3F302D] whitespace-pre-wrap break-words">
            {selectedEntry.content || '（这篇日记没有填写文字内容）'}
          </div>

          {selectedEntry.images.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-[#755F5C] tabular-nums">
                手账附图 · 共 {selectedEntry.images.length} 张
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedEntry.images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setLightboxImage(img)}
                    className="aspect-square rounded-[14px_16px_13px_15px] overflow-hidden border border-[#9A7276]/25 shadow-sm bg-[#F6E7E9] cursor-pointer"
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-[1.02] transition-transform"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </article>

        {lightboxImage && (
          <PhotoLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
        )}

        <ConfirmDeleteDialog
          open={pendingDeleteId !== null}
          title="删除这篇成长日记？"
          description="删除后文字和附图将从本机清理，无法撤销。"
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#3F302D]">成长日记</h1>
          <p className="text-xs font-medium text-[#755F5C] mt-0.5 tabular-nums">
            共留存 {sortedDiaries.length} 篇生活瞬间
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode({ kind: 'form' })}
          className="min-h-[44px] px-4 py-2 text-sm font-bold sketch-btn-primary inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          写日记
        </button>
      </div>

      {sortedDiaries.length === 0 ? (
        <div className="sketch-card p-6 sm:p-8 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-full max-w-[260px] mx-auto rounded-[16px] overflow-hidden border border-[#9A7276]/20 shadow-sm">
            <img
              src="/src/assets/images/empty_diary_illustration_1794968780474.jpg"
              alt="手绘风格日记本与安睡宝宝插画"
              referrerPolicy="no-referrer"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-[#3F302D]">还没有记下第一篇日记</h2>
            <p className="text-sm text-[#755F5C] leading-relaxed">
              用文字、语音转写或几张日常照片，记下宝宝今天的新表情和小动作。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMode({ kind: 'form' })}
            className="min-h-[46px] px-6 py-2.5 text-sm font-bold sketch-btn-primary inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            写下第一篇日记
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedDiaries.map((entry) => {
            const entryAge = calculateBabyAge(profile.birthDate, entry.date);
            const moodMeta = DIARY_MOODS.find((m) => m.value === entry.mood);
            const cover = entry.images[0];

            return (
              <div
                key={entry.id}
                className="sketch-card p-4 sm:p-5 flex flex-col justify-between gap-3"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setMode({ kind: 'detail', entryId: entry.id })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMode({ kind: 'detail', entryId: entry.id });
                    }
                  }}
                  className="space-y-2.5 text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#755F5C] tabular-nums">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-bold text-[#3F302D]">{entry.date}</span>
                      {entryAge.valid && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#D64E38] font-bold">
                            第 {entryAge.dayNumber} 天
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="font-medium">{entry.recorder}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-[#755F5C]">
                        <span className="inline-flex items-center gap-1.5 font-bold text-[#3F302D]">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: moodMeta?.tone ?? '#8DA143' }}
                          />
                          {entry.mood}
                        </span>
                        {entry.weather && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{entry.weather}</span>
                          </>
                        )}
                      </div>

                      <p className="text-sm text-[#3F302D] leading-relaxed line-clamp-3 break-words">
                        {entry.content || '（纯图片日记）'}
                      </p>
                    </div>

                    {cover && (
                      <div className="relative w-20 h-20 rounded-[12px] overflow-hidden border border-[#9A7276]/25 shrink-0 bg-[#F6E7E9]">
                        <img
                          src={cover.dataUrl}
                          alt={cover.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {entry.images.length > 1 && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-[#3F302D]/75 text-[#FCF8EC] text-[10px] font-bold tabular-nums">
                            {entry.images.length} 张
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#9A7276]/25">
                  <button
                    type="button"
                    onClick={() => setMode({ kind: 'detail', entryId: entry.id })}
                    className="min-h-[40px] px-2 text-xs font-bold text-[#4D7FA3] hover:underline cursor-pointer"
                  >
                    查看详情
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(entry.id)}
                    className="min-h-[40px] px-2.5 text-xs font-bold text-[#D64E38] hover:bg-[#FBE5E0] rounded-[10px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDeleteDialog
        open={pendingDeleteId !== null}
        title="删除这篇成长日记？"
        description="删除后文字和附图将从本机清理，无法撤销。"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

const DiaryForm: React.FC<{
  profile: BabyProfile;
  editing?: DiaryEntry;
  onCancel: () => void;
  onSave: (entry: DiaryEntry) => Promise<void>;
}> = ({ profile, editing, onCancel, onSave }) => {
  const defaultRecorder = profile.recorders[0] ?? '妈妈';
  const [date, setDate] = useState(editing?.date ?? getTodayISO());
  const [mood, setMood] = useState<DiaryMood>(editing?.mood ?? '开心');
  const [weather, setWeather] = useState<DiaryWeather | undefined>(editing?.weather);
  const [content, setContent] = useState(editing?.content ?? '');
  const [images, setImages] = useState<MediaAttachment[]>(editing?.images ?? []);
  const [recorder, setRecorder] = useState(editing?.recorder ?? defaultRecorder);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const committedContentRef = useRef(content);

  useEffect(() => {
    committedContentRef.current = content;
  }, [content]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      setInterimText('');
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setSpeechNotice('当前浏览器暂不支持语音识别，已保留您的输入，请直接手动输入。');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let finalChunk = '';
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? '';
          if (result.isFinal) {
            finalChunk += text;
          } else {
            interimChunk += text;
          }
        }

        if (finalChunk) {
          setContent((prev) => prev + finalChunk);
        }
        setInterimText(interimChunk);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setInterimText('');
        setSpeechNotice('语音转写已中断或未获得麦克风权限，已保留原有文字，可继续手动补充。');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      setSpeechNotice(null);
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setSpeechNotice('启动语音转写失败，已保留已输入内容，请手动填写。');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setErrorMsg('请选择日记日期');
      return;
    }
    if (!content.trim() && images.length === 0) {
      setErrorMsg('请写下一些文字或上传至少一张照片');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      await onSave({
        id: editing?.id ?? generateId('diary'),
        date,
        recorder,
        mood,
        weather,
        content: content.trim(),
        images,
        createdAt: editing?.createdAt ?? now,
        updatedAt: now,
      });
    } catch {
      setErrorMsg('保存日记失败，请重试');
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
          {editing ? '编辑日记' : '写新日记'}
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
          <span className="text-sm font-bold text-[#3F302D] inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#755F5C]" />
            日期
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 text-sm sketch-input tabular-nums"
          />
        </label>

        {/* Mood Selector */}
        <div className="space-y-2">
          <span className="text-sm font-bold text-[#3F302D] block">宝宝心情</span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {DIARY_MOODS.map((item) => {
              const active = mood === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMood(item.value)}
                  className={`min-h-[44px] px-3 py-2 text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? 'bg-[#4D7FA3] text-[#FCF8EC] rounded-[13px_15px_14px_12px] shadow-sm'
                      : 'bg-[#F6E7E9] text-[#3F302D] border border-[#9A7276]/25 hover:bg-[#EED8DC] rounded-[14px_12px_15px_13px]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.tone }}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weather Optional */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#3F302D]">今天天气（可选）</span>
            {weather && (
              <button
                type="button"
                onClick={() => setWeather(undefined)}
                className="text-xs font-medium text-[#755F5C] hover:underline cursor-pointer"
              >
                清除选择
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {DIARY_WEATHERS.map((w) => {
              const active = weather === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeather(active ? undefined : w)}
                  className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#EBC148] text-[#3F302D] rounded-[12px] shadow-sm'
                      : 'bg-[#F6E7E9] text-[#755F5C] border border-[#9A7276]/20 hover:bg-[#EED8DC] rounded-[12px]'
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content + Voice Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="diary-content" className="text-sm font-bold text-[#3F302D]">
              日记正文
            </label>
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 rounded-[12px] transition-colors cursor-pointer ${
                isListening
                  ? 'bg-[#D64E38] text-[#FCF8EC]'
                  : 'bg-[#E2EFF7] text-[#3F302D] border border-[#5B92B8]/30 hover:bg-[#D2E6F3]'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  停止语音转写
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  语音转文字
                </>
              )}
            </button>
          </div>

          {isListening && (
            <div className="px-3 py-2 rounded-[11px] bg-[#E2EFF7] border border-[#5B92B8]/30 text-xs font-medium text-[#3F302D]">
              正在聆听中文语音… {interimText ? `（识别中：${interimText}）` : '请对着麦克风轻声描述'}
            </div>
          )}

          {speechNotice && (
            <div className="px-3 py-2 rounded-[11px] bg-[#FCF2D2] border border-[#D6A53A]/35 text-xs font-medium text-[#3F302D]">
              {speechNotice}
            </div>
          )}

          <textarea
            id="diary-content"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="记下今天的小事：第一次咯咯笑、翻身尝试、晒太阳时的表情……"
            className="w-full p-3.5 text-sm leading-relaxed sketch-input resize-y"
          />
        </div>

        <PhotoUploader
          images={images}
          onChange={setImages}
          multiple
          label="手账照片（可多选）"
          helperText="支持预览与删除"
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
            {saving ? '保存中…' : '保存日记'}
          </button>
        </div>
      </form>
    </div>
  );
};
