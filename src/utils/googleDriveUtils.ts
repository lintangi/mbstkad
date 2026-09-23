import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { DEFAULT_GAS_URL } from '../context/AppContext';

export const TKAD_DRIVE_FOLDER_ID = '1Adx3ZBQrcOx_X2iWWzag05xsywaHyOoC';
export const TKAD_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${TKAD_DRIVE_FOLDER_ID}?usp=sharing`;

let cachedAccessToken: string | null = null;

export interface DriveUploadResult {
  fileId?: string;
  name: string;
  url: string;
  viewUrl?: string;
  size: string;
  storageProvider: 'google_drive' | 'server' | 'inline';
}

/**
 * Extracts Google Drive file ID from various Drive URL formats.
 */
export function extractDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/FILE_ID/
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Pattern 2: id=FILE_ID
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  // Pattern 3: /d/FILE_ID (lh3.googleusercontent.com/d/FILE_ID)
  const matchUserContent = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (matchUserContent && matchUserContent[1]) return matchUserContent[1];

  // Pattern 4: /open?id=FILE_ID
  const matchOpenId = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (matchOpenId && matchOpenId[1]) return matchOpenId[1];

  // If it's a raw Drive File ID (alphanumeric, 25-45 chars)
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Normalizes any Google Drive link or ID into a direct, high-performance image embedding URL.
 * Also preserves local /uploads/ URLs (converted to absolute origin) and Base64 Data URIs.
 */
export function normalizeGoogleDriveImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Already a data URI
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Local server relative upload -> convert to absolute origin URL so other devices can render it
  if (trimmed.startsWith('/uploads/')) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${trimmed}`;
    }
    return trimmed;
  }

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    // lh3.googleusercontent.com/d/FILE_ID is the primary high-performance direct embed endpoint
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

/**
 * Returns an ordered array of fallback URLs for a given Google Drive file or server image URL.
 */
export function getDriveImageFallbackUrls(url: string): string[] {
  if (!url || typeof url !== 'string') return [];
  const trimmed = url.trim();
  if (trimmed.startsWith('data:')) return [trimmed];

  if (trimmed.startsWith('/uploads/')) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return origin ? [`${origin}${trimmed}`, trimmed] : [trimmed];
  }

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return [
      `https://lh3.googleusercontent.com/d/${fileId}`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
      `https://docs.google.com/uc?export=view&id=${fileId}`,
      `https://drive.google.com/uc?id=${fileId}&export=download`,
      trimmed,
    ];
  }
  return [trimmed];
}

/**
 * Automatic image error handler for React <img onError={...}> tags.
 * Seamlessly cycles through Google Drive direct embed, thumbnail, uc?export=view, and original URLs.
 */
export function handleDriveImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  originalUrl: string
) {
  const img = e.currentTarget;
  const fallbacks = getDriveImageFallbackUrls(originalUrl);
  const currentIndex = parseInt(img.dataset.fallbackIndex || '0', 10);

  if (currentIndex + 1 < fallbacks.length) {
    const nextIndex = currentIndex + 1;
    img.dataset.fallbackIndex = String(nextIndex);
    img.src = fallbacks[nextIndex];
  }
}

/**
 * Alternative fallback direct image URL for Google Drive
 */
export function getDriveThumbnailUrl(fileId: string, width = 1200): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

/**
 * Uploads a file directly to the Google Drive Folder (TKAD Adiwerna) via Google Apps Script Webhook.
 * This runs server-side on Google Cloud, bypassing iframe/browser OAuth blocks and setting public view permissions automatically.
 */
export async function uploadMediaViaGasWebhook(
  payload: { filename: string; filetype: string; base64: string },
  gasWebhookUrl?: string,
  folderId = TKAD_DRIVE_FOLDER_ID
): Promise<DriveUploadResult> {
  const targetGasUrl = gasWebhookUrl || localStorage.getItem('tkad_gas_url_v3') || DEFAULT_GAS_URL;

  if (!targetGasUrl) {
    throw new Error('URL Google Apps Script Webhook belum dikonfigurasi.');
  }

  const cleanBase64 = payload.base64.replace(/^data:.*?;base64,/, '');

  const requestBody = {
    action: 'UPLOAD_MEDIA',
    folderId: folderId,
    filename: payload.filename,
    filetype: payload.filetype,
    base64: cleanBase64,
  };

  const response = await fetch(targetGasUrl, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script merespons error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.status === 'error' || result.success === false) {
    throw new Error(result.message || 'Gagal menyimpan berkas ke Google Drive via Google Apps Script.');
  }

  const fileId = result.fileId || extractDriveFileId(result.url || result.viewUrl);
  const directEmbedUrl = fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : result.url;

  return {
    fileId: fileId || undefined,
    name: result.name || payload.filename,
    url: directEmbedUrl,
    viewUrl: result.viewUrl || (fileId ? `https://drive.google.com/file/d/${fileId}/view?usp=sharing` : undefined),
    size: result.size || 'Tersimpan di Drive',
    storageProvider: 'google_drive',
  };
}

/**
 * Multi-Tiered Intelligent Upload Pipeline:
 * 1. Read file as Base64 Data URL.
 * 2. Try Google Drive via Google Apps Script (Folder TKAD Adiwerna).
 * 3. Fallback to /api/upload on local server.
 * 4. Fallback to Base64 Data URI inline embedding (guaranteed 100% success).
 */
export async function uploadMediaToDriveOrFallback(
  file: File,
  onProgress?: (percent: number, statusText: string) => void,
  options?: { gasWebhookUrl?: string; folderId?: string }
): Promise<DriveUploadResult> {
  const maxSizeBytes = 15 * 1024 * 1024; // 15MB
  if (file.size > maxSizeBytes) {
    throw new Error(`Ukuran berkas (${(file.size / 1024 / 1024).toFixed(2)} MB) melebihi batas 15 MB.`);
  }

  onProgress?.(15, 'Membaca berkas dari perangkat...');

  // Step 1: Read file as Base64
  const base64Data: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Gagal membaca berkas dari penyimpanan lokal.'));
    reader.readAsDataURL(file);
  });

  const fileSizeFormatted = `${(file.size / 1024).toFixed(1)} KB`;

  // Step 2: Try uploading to Google Drive via Google Apps Script Webhook
  try {
    onProgress?.(40, 'Mengunggah ke Google Drive (Folder Bank Soal TKAD Adiwerna)...');
    
    // Set 25s timeout for Google Drive upload
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Koneksi Google Drive timeout setelah 25 detik.')), 25000)
    );

    const gasUploadPromise = uploadMediaViaGasWebhook(
      {
        filename: file.name,
        filetype: file.type,
        base64: base64Data,
      },
      options?.gasWebhookUrl,
      options?.folderId || TKAD_DRIVE_FOLDER_ID
    );

    const driveResult = await Promise.race([gasUploadPromise, timeoutPromise]);
    onProgress?.(95, 'Memverifikasi tautan berkas di Google Drive...');
    return driveResult;
  } catch (driveErr: any) {
    console.warn('Upload Google Drive via GAS gagal/timeout, beralih ke server fallback:', driveErr);
  }

  // Step 3: Try uploading to Node / Express /api/upload endpoint
  try {
    onProgress?.(65, 'Mengunggah ke media server aplikasi...');
    const serverResponse = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        filetype: file.type,
        base64: base64Data,
      }),
    });

    if (serverResponse.ok) {
      const serverResult = await serverResponse.json();
      if (serverResult.success && serverResult.url) {
        onProgress?.(95, 'Berkas berhasil disimpan di server media.');
        // Ensure absolute origin URL so it works on other devices/domains
        const absoluteUrl = serverResult.url.startsWith('/uploads/') && typeof window !== 'undefined'
          ? `${window.location.origin}${serverResult.url}`
          : serverResult.url;

        // For images under 8MB, prefer base64Data for 100% cross-device guarantee
        const finalUrl = file.type.startsWith('image/') && file.size <= 8 * 1024 * 1024 ? base64Data : absoluteUrl;

        return {
          name: serverResult.name || file.name,
          url: finalUrl,
          size: serverResult.size || fileSizeFormatted,
          storageProvider: 'server',
        };
      }
    }
  } catch (serverErr) {
    console.warn('Upload ke /api/upload gagal, menggunakan Base64 inline:', serverErr);
  }

  // Step 4: Graceful Inline Base64 Data URI Fallback
  onProgress?.(95, 'Menyimpan berkas sebagai lampiran langsung (Inline Media)...');
  return {
    name: file.name,
    url: base64Data,
    size: fileSizeFormatted,
    storageProvider: 'inline',
  };
}

/**
 * Retrieves a Google Drive OAuth access token using Firebase Auth Popup.
 */
export async function getDriveToken(): Promise<string> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive');
  provider.addScope('https://www.googleapis.com/auth/drive.file');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh token akses Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (error: any) {
    console.error('Error obtaining Google Drive access token:', error);
    throw new Error(error.message || 'Proses otentikasi Google Drive dibatalkan atau gagal.');
  }
}

export function clearDriveToken(): void {
  cachedAccessToken = null;
}

export function hasDriveToken(): boolean {
  return cachedAccessToken !== null;
}
