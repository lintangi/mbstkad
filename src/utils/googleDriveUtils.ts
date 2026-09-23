import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

let cachedAccessToken: string | null = null;

/**
 * Retrieves a Google Drive OAuth access token using Firebase Auth Popup.
 * Caches the token in-memory to follow security rules.
 */
export async function getDriveToken(): Promise<string> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  const provider = new GoogleAuthProvider();
  // Request full Drive and app-specific Drive scopes
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

/**
 * Clears the cached token (useful for logout/reconnecting)
 */
export function clearDriveToken(): void {
  cachedAccessToken = null;
}

/**
 * Checks if a token is currently cached in memory
 */
export function hasDriveToken(): boolean {
  return cachedAccessToken !== null;
}

export interface DriveUploadResult {
  fileId: string;
  name: string;
  url: string;
  size: string;
}

/**
 * Uploads a file directly to Google Drive via client-side fetch.
 * Targets the shared TKAD Adiwerna folder first, falling back to Root Drive if permissions are restricted.
 */
export async function uploadToGoogleDrive(
  file: File,
  accessToken: string
): Promise<DriveUploadResult> {
  const boundary = '314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;

  // Official parent folder ID for Bank Soal TKAD Adiwerna
  const folderId = '1Adx3ZBQrcOx_X2iWWzag05xsywaHyOoC';
  
  let metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [folderId]
  };

  let multipartRequestBody = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    delimiter,
    'Content-Type: ' + file.type + '\r\n\r\n',
    file,
    close_delim
  ], { type: 'multipart/related; boundary=' + boundary });

  // Step 1: Execute Upload
  let response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  // Step 1b: Fallback to Root Drive if the shared folder is not writable
  if (!response.ok) {
    console.warn('Gagal mengunggah ke folder TKAD. Mencoba mengunggah ke Root Drive Anda...');
    metadata = {
      name: file.name,
      mimeType: file.type,
      parents: [] // Let Drive put it in the user's root directory
    };

    multipartRequestBody = new Blob([
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      delimiter,
      'Content-Type: ' + file.type + '\r\n\r\n',
      file,
      close_delim
    ], { type: 'multipart/related; boundary=' + boundary });

    response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive API returned error: ${response.status} - ${errText}`);
  }

  const fileData = await response.json();
  const fileId = fileData.id;

  if (!fileId) {
    throw new Error('Gagal mendapatkan ID File dari respon unggahan Google Drive.');
  }

  // Step 2: Grant read permission to "anyone with link" so other Bank Soal users can view the media
  try {
    const permissionResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
    
    if (!permissionResponse.ok) {
      console.warn('Gagal mengubah hak akses file menjadi publik (pembaca).', await permissionResponse.text());
    }
  } catch (permissionErr) {
    console.error('Error setting permissions on Drive file:', permissionErr);
  }

  // Step 3: Format the direct embedding URL
  // We use the direct rendering endpoint so images can load cleanly inside <img> tags
  const directViewUrl = `https://docs.google.com/uc?export=view&id=${fileId}`;

  return {
    fileId,
    name: file.name,
    url: directViewUrl,
    size: `${(file.size / 1024).toFixed(1)} KB`
  };
}
