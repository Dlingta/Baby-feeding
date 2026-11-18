import type { FeedingType } from '../types/baby';

export interface OcrFeedingDraft {
  success: boolean;
  rawText: string;
  time?: string;
  type?: FeedingType;
  durationMinutes?: number;
  amountMl?: number;
  otherValue?: string;
  note?: string;
  errorReason?: string;
}

export function parseFeedingOcrText(rawText: string): OcrFeedingDraft {
  const cleaned = rawText.replace(/\r/g, '\n').trim();
  if (!cleaned) {
    return {
      success: false,
      rawText: '',
      errorReason: '未能从照片中提取出清晰文字，请手动核对填写。',
    };
  }

  let detectedType: FeedingType | undefined;
  let durationMinutes: number | undefined;
  let amountMl: number | undefined;
  let otherValue: string | undefined;
  let detectedTime: string | undefined;

  // Match HH:mm or HH：mm or HH点mm
  const timeMatch = cleaned.match(/\b([01]?\d|2[0-3])\s*[:：点]\s*([0-5]\d)\b/);
  if (timeMatch) {
    const hh = String(Number(timeMatch[1])).padStart(2, '0');
    const mm = timeMatch[2];
    detectedTime = `${hh}:${mm}`;
  }

  // Detect feeding type keywords
  if (/母乳|亲喂|吸奶|左侧|右侧/.test(cleaned)) {
    detectedType = 'breast';
  } else if (/配方|奶粉|牛奶|冲奶|瓶喂/.test(cleaned)) {
    detectedType = 'formula';
  } else if (/喝水|温水|水|辅食|米粉|果汁/.test(cleaned)) {
    detectedType = 'other';
  }

  // Extract volume in ml / 毫升
  const mlMatch = cleaned.match(/(\d{1,3})\s*(?:ml|mL|ML|毫升)/);
  if (mlMatch) {
    const val = Number(mlMatch[1]);
    if (val > 0 && val <= 999) {
      amountMl = val;
      if (!detectedType) detectedType = 'formula';
    }
  }

  // Extract duration in minutes / 分钟
  const minMatch = cleaned.match(/(\d{1,3})\s*(?:分钟|分|min|MIN)/);
  if (minMatch) {
    const val = Number(minMatch[1]);
    if (val > 0 && val <= 180) {
      durationMinutes = val;
      if (!detectedType) detectedType = 'breast';
    }
  }

  // Fallback bare number if type was detected
  if (detectedType === 'formula' && amountMl === undefined) {
    const bareNum = cleaned.match(/\b(\d{2,3})\b/);
    if (bareNum) {
      const val = Number(bareNum[1]);
      if (val >= 10 && val <= 500) amountMl = val;
    }
  } else if (detectedType === 'breast' && durationMinutes === undefined) {
    const bareNum = cleaned.match(/\b(\d{1,2})\b/);
    if (bareNum) {
      const val = Number(bareNum[1]);
      if (val >= 1 && val <= 120) durationMinutes = val;
    }
  } else if (detectedType === 'other') {
    if (mlMatch) {
      otherValue = `${mlMatch[1]} ml`;
    } else {
      otherValue = cleaned.split('\n')[0]?.slice(0, 30);
    }
  }

  const hasUsefulField =
    Boolean(detectedTime) ||
    Boolean(detectedType) ||
    durationMinutes !== undefined ||
    amountMl !== undefined ||
    Boolean(otherValue);

  return {
    success: hasUsefulField,
    rawText: cleaned,
    time: detectedTime,
    type: detectedType,
    durationMinutes,
    amountMl,
    otherValue,
    note: cleaned.slice(0, 120),
    errorReason: hasUsefulField
      ? undefined
      : '照片文字较模糊或格式不规则，请手动核对填写，照片已为您存档。',
  };
}

export async function runLocalFeedingOcr(
  imageDataUrl: string,
  onProgress?: (statusText: string) => void
): Promise<OcrFeedingDraft> {
  try {
    onProgress?.('正在初始化本地 OCR 引擎…');
    const { createWorker } = await import('tesseract.js');

    const ocrPromise = (async () => {
      // Try Chinese + English first; if language pack fails in offline mode, fall back cleanly
      let worker;
      try {
        worker = await createWorker('chi_sim+eng', 1, {
          logger: (m: { status?: string; progress?: number }) => {
            if (m.status === 'recognizing text' && typeof m.progress === 'number') {
              onProgress?.(`正在本地识别记录 (${Math.round(m.progress * 100)}%)…`);
            }
          },
        });
      } catch {
        onProgress?.('正在尝试基础数字与英文识别…');
        worker = await createWorker('eng');
      }

      try {
        const result = await worker.recognize(imageDataUrl);
        return result?.data?.text ?? '';
      } finally {
        await worker.terminate();
      }
    })();

    // Guard against offline network stalls when fetching Tesseract language assets
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('OCR_TIMEOUT')), 18000);
    });

    const text = await Promise.race([ocrPromise, timeoutPromise]);
    return parseFeedingOcrText(text);
  } catch {
    return {
      success: false,
      rawText: '',
      errorReason:
        '本地 OCR 识别未完成或当前环境无法加载识别字库，请手动填写喂养数据，照片已为您安全存档。',
    };
  }
}
