// src/lib/storage/localStorage.ts
import { mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function safeExt(mimeType: string): string {
  return MIME_TO_EXT[mimeType] ?? 'bin';
}

export interface StorageResult {
  localPath: string;
  sizeBytes: number;
  mimeType: string;
}

/**
 * LINE経由で取得したバイナリデータをローカルに保存する
 * 将来S3などに差し替え可能なインターフェースで包んでいる
 */
export async function saveLineBinaryToLocal(params: {
  baseDir: string; // 例: /var/lib/kai/uploads
  userId: string;
  sessionId: string;
  messageId: string;
  mimeType: string;
  bytes: Uint8Array;
}): Promise<StorageResult> {
  const { baseDir, userId, sessionId, messageId, mimeType, bytes } = params;

  // ユーザー入力はパスに使わない（userId/sessionIdは内部IDなのでOKだが念のため階層固定）
  const dir = path.join(baseDir, 'line', userId, sessionId);
  await mkdir(dir, { recursive: true });

  const ext = safeExt(mimeType);
  const filename = `${messageId}.${ext}`;
  const filePath = path.join(dir, filename);

  await writeFile(filePath, bytes);

  const st = await stat(filePath);
  return { localPath: filePath, sizeBytes: Number(st.size), mimeType };
}

/**
 * ストレージインターフェース（将来のS3対応用）
 */
export interface IStorageService {
  save(params: {
    userId: string;
    sessionId: string;
    messageId: string;
    mimeType: string;
    bytes: Uint8Array;
  }): Promise<StorageResult>;
}

/**
 * ローカルストレージ実装
 */
export class LocalStorageService implements IStorageService {
  constructor(private baseDir: string) {}

  async save(params: {
    userId: string;
    sessionId: string;
    messageId: string;
    mimeType: string;
    bytes: Uint8Array;
  }): Promise<StorageResult> {
    return saveLineBinaryToLocal({
      baseDir: this.baseDir,
      ...params,
    });
  }
}
