import fs from 'fs';
import path from 'path';

interface CachedTaskResult {
  cacheKey: string;
  documentHash: string;
  taskType: string;
  model: string;
  promptVersion: string;
  resultData: any;
  cachedAt: string;
}

export class ExtractionTaskCache {
  private static instance: ExtractionTaskCache;
  private cacheMap: Map<string, CachedTaskResult> = new Map();
  private storageFile: string;

  private constructor() {
    this.storageFile = path.join(process.cwd(), 'storage', 'extraction_task_cache.json');
    this.loadFromDisk();
  }

  public static getInstance(): ExtractionTaskCache {
    if (!ExtractionTaskCache.instance) {
      ExtractionTaskCache.instance = new ExtractionTaskCache();
    }
    return ExtractionTaskCache.instance;
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        const list: CachedTaskResult[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(item => this.cacheMap.set(item.cacheKey, item));
          console.log(`[ExtractionTaskCache] Loaded ${list.length} task cache records from disk.`);
        }
      }
    } catch (err) {
      console.warn("[ExtractionTaskCache] Failed to load cache from disk:", err);
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const list = Array.from(this.cacheMap.values());
      fs.writeFileSync(this.storageFile, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn("[ExtractionTaskCache] Failed to save cache to disk:", err);
    }
  }

  public computeCacheKey(params: {
    documentHash: string;
    taskType: string;
    period?: string;
    model?: string;
    promptVersion?: string;
  }): string {
    const periodStr = params.period || 'GENERAL';
    const modelStr = params.model || 'gemini-3.6-flash';
    const versionStr = params.promptVersion || 'v1.0';
    return `${params.documentHash}_${params.taskType}_${periodStr}_${modelStr}_${versionStr}`;
  }

  public get(cacheKey: string): CachedTaskResult | null {
    const res = this.cacheMap.get(cacheKey);
    if (res) {
      console.log(`[ExtractionTaskCache] Cache HIT for key: ${cacheKey}`);
      return res;
    }
    return null;
  }

  public set(params: {
    cacheKey: string;
    documentHash: string;
    taskType: string;
    model: string;
    promptVersion: string;
    resultData: any;
  }) {
    const record: CachedTaskResult = {
      cacheKey: params.cacheKey,
      documentHash: params.documentHash,
      taskType: params.taskType,
      model: params.model,
      promptVersion: params.promptVersion,
      resultData: params.resultData,
      cachedAt: new Date().toISOString()
    };
    this.cacheMap.set(params.cacheKey, record);
    this.saveToDisk();
    console.log(`[ExtractionTaskCache] Cached task result for key: ${params.cacheKey}`);
  }
}

export const extractionTaskCache = ExtractionTaskCache.getInstance();
