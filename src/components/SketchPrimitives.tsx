import React, { useState } from 'react';
import { ImagePlus, Trash2, X, ZoomIn } from 'lucide-react';
import type { MediaAttachment } from '../types/baby';
import { compressImageFile } from '../utils/media';

export const HandDrawnDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 400 12"
    preserveAspectRatio="none"
    aria-hidden="true"
    className={`w-full h-3 text-[#9A7276]/35 ${className}`}
  >
    <path
      d="M2 6 Q 65 3.5, 130 6.5 T 265 5.5 T 398 6.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="7 5"
    />
  </svg>
);

export const StorybookCloud: React.FC<{ className?: string }> = ({ className = 'w-14 h-9' }) => (
  <svg viewBox="0 0 80 48" aria-hidden="true" className={className}>
    <path
      d="M19 38 H61 C69 38 74 33 74 26 C74 20 69 15 63 15 C61 8 54 4 46 5 C40 6 35 10 33 15 C27 13 21 16 19 22 C13 22 8 26 8 31 C8 35 13 38 19 38 Z"
      fill="#FCF8EC"
      stroke="#9A7276"
      strokeOpacity="0.45"
      strokeWidth="1.6"
      strokeDasharray="5 3"
      strokeLinejoin="round"
    />
  </svg>
);

export const StorybookFlower: React.FC<{ className?: string; petalColor?: string }> = ({
  className = 'w-6 h-6',
  petalColor = '#FCF8EC',
}) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
    <circle cx="16" cy="7" r="4.5" fill={petalColor} stroke="#C99499" strokeWidth="1.2" />
    <circle cx="24.5" cy="13" r="4.5" fill={petalColor} stroke="#C99499" strokeWidth="1.2" />
    <circle cx="21" cy="23" r="4.5" fill={petalColor} stroke="#C99499" strokeWidth="1.2" />
    <circle cx="11" cy="23" r="4.5" fill={petalColor} stroke="#C99499" strokeWidth="1.2" />
    <circle cx="7.5" cy="13" r="4.5" fill={petalColor} stroke="#C99499" strokeWidth="1.2" />
    <circle cx="16" cy="16" r="4" fill="#EBC148" />
  </svg>
);

export const RecorderPicker: React.FC<{
  recorders: string[];
  value: string;
  onChange: (recorder: string) => void;
  label?: string;
}> = ({ recorders, value, onChange, label = '本次记录人' }) => {
  const list = recorders.length > 0 ? recorders : ['妈妈', '爸爸', '祖辈', '保姆', '其他'];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#3F302D]">{label}</span>
        <span className="text-xs text-[#755F5C]">每条记录独立署名</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((person) => {
          const active = value === person;
          return (
            <button
              key={person}
              type="button"
              onClick={() => onChange(person)}
              className={`min-h-[44px] px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#4D7FA3] text-[#FCF8EC] rounded-[13px_16px_14px_15px] shadow-sm'
                  : 'bg-[#F6E7E9] text-[#3F302D] border border-[#9A7276]/25 hover:bg-[#EED8DC] rounded-[15px_13px_15px_13px]'
              }`}
            >
              {person}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const PhotoUploader: React.FC<{
  images: MediaAttachment[];
  onChange: (images: MediaAttachment[]) => void;
  multiple?: boolean;
  label?: string;
  helperText?: string;
}> = ({
  images,
  onChange,
  multiple = true,
  label = '添加照片',
  helperText = '照片仅保存在本机浏览器中',
}) => {
  const [processing, setProcessing] = useState(false);
  const [previewImg, setPreviewImg] = useState<MediaAttachment | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setProcessing(true);
    try {
      const compressed = await Promise.all(
        Array.from(files).map((file) => compressImageFile(file))
      );
      onChange(multiple ? [...images, ...compressed] : compressed.slice(0, 1));
    } finally {
      setProcessing(false);
      e.target.value = '';
    }
  };

  const removeImage = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-[#3F302D]">{label}</span>
        <span className="text-xs text-[#755F5C]">{helperText}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative w-24 h-24 rounded-[14px_16px_15px_13px] overflow-hidden border border-[#9A7276]/30 bg-[#F6E7E9] shadow-sm group"
          >
            <img
              src={img.dataUrl}
              alt={img.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setPreviewImg(img)}
            />
            <button
              type="button"
              aria-label="查看大图"
              onClick={() => setPreviewImg(img)}
              className="absolute bottom-1 left-1 w-7 h-7 rounded-lg bg-[#3F302D]/70 text-[#FCF8EC] flex items-center justify-center opacity-90 hover:opacity-100 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="移除照片"
              onClick={() => removeImage(img.id)}
              className="absolute top-1 right-1 w-7 h-7 rounded-lg bg-[#D64E38] text-[#FCF8EC] flex items-center justify-center shadow-sm hover:bg-[#BC3F2B] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <label className="w-24 h-24 rounded-[15px_13px_16px_14px] border-2 border-dashed border-[#9A7276]/40 bg-[#FCF8EC] hover:bg-[#FBF0C9] flex flex-col items-center justify-center gap-1.5 text-[#3F302D] cursor-pointer transition-colors">
          <ImagePlus className="w-5 h-5 text-[#755F5C]" />
          <span className="text-xs font-semibold">{processing ? '处理中…' : '上传照片'}</span>
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFiles}
            className="sr-only"
            disabled={processing}
          />
        </label>
      </div>

      {previewImg && (
        <PhotoLightbox image={previewImg} onClose={() => setPreviewImg(null)} />
      )}
    </div>
  );
};

export const PhotoLightbox: React.FC<{
  image: MediaAttachment;
  onClose: () => void;
}> = ({ image, onClose }) => (
  <div
    className="fixed inset-0 z-50 bg-[#3F302D]/75 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onClose}
    role="dialog"
    aria-modal="true"
  >
    <div
      className="relative max-w-lg w-full bg-[#FCF8EC] p-3 rounded-[20px_22px_18px_20px] border border-[#9A7276]/30 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="关闭大图"
        className="absolute -top-3 -right-3 min-h-[44px] min-w-[44px] rounded-full bg-[#D64E38] text-[#FCF8EC] flex items-center justify-center shadow-md cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>
      <img
        src={image.dataUrl}
        alt={image.name}
        referrerPolicy="no-referrer"
        className="w-full max-h-[75vh] object-contain rounded-[12px]"
      />
    </div>
  </div>
);

export const ConfirmDeleteDialog: React.FC<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ open, title, description, confirmLabel = '确认删除', onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#3F302D]/45 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-[#FCF8EC] border border-[#9A7276]/30 rounded-[20px_18px_22px_18px] p-5 shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-[#FBE5E0] text-[#D64E38] flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#3F302D]">{title}</h3>
            <p className="text-sm text-[#755F5C] leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[44px] px-4 py-2.5 text-sm font-semibold sketch-btn-secondary cursor-pointer"
          >
            先保留
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 min-h-[44px] px-4 py-2.5 text-sm font-semibold bg-[#D64E38] hover:bg-[#BC3F2B] text-[#FCF8EC] rounded-[14px_16px_13px_15px] shadow-sm cursor-pointer transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
