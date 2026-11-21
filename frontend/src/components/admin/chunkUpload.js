import { describeUploadError } from './uploadError';

// Vercel Functions menolak body request di atas 4.5 MB (413 FUNCTION_PAYLOAD_TOO_LARGE).
// Setiap bagian dikirim < batas itu agar unggahan gambar tetap berhasil di produksi.
export const CHUNK_SIZE = 3 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 14 * 1024 * 1024;

// Sebagian pemilih berkas menyerahkan audio/video lewat jalur gambar. Backend
// menolak kalau kind tidak cocok dengan ekstensi, jadi kind diturunkan dari MIME.
const kindOf = (file) => {
  const mime = String(file.type || '').toLowerCase();
  const ext = String(file.name || '').split('.').pop().toLowerCase();
  if (mime.startsWith('video/') || ['mp4', 'm4v', 'mov', 'webm', 'ogg', 'ogv'].includes(ext)) return 'video';
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac', 'oga'].includes(ext)) return 'audio';
  return 'image';
};

const PART_RETRIES = 2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const postPart = async (api, uploadId, index, chunk) => {
  const data = new FormData();
  data.append('upload_id', uploadId);
  data.append('index', String(index));
  data.append('file', chunk, `part-${index}.bin`);
  const response = await fetch(`${api}/api/portfolio/upload-part`, {
    method: 'POST',
    body: data,
    credentials: 'include',
  });
  if (!response.ok) throw new Error(await describeUploadError(response));
};

/**
 * Unggah gambar secara bertahap lalu rakit di server.
 * Kembalikan objek { url, name, size } dari endpoint upload-finish.
 */
export const uploadImageInParts = async (api, file, onProgress) => {
  const kind = kindOf(file);
  if (kind === 'image' && file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `Gambar lebih dari ${Math.round(MAX_IMAGE_BYTES / 1048576)} MB. Kecilkan ukurannya lalu coba lagi.`
    );
  }
  const name = file.type && file.name ? file.name : `${String(file.name || 'gambar').replace(/\.[^.]+$/, '')}.jpg`;
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const total = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

  for (let index = 0; index < total; index += 1) {
    const chunk = file.slice(index * CHUNK_SIZE, Math.min(file.size, (index + 1) * CHUNK_SIZE));
    let attempt = 0;
    for (;;) {
      try {
        await postPart(api, uploadId, index, chunk);
        break;
      } catch (error) {
        if (attempt >= PART_RETRIES) throw error;
        attempt += 1;
        await sleep(600 * attempt);
      }
    }
    if (onProgress) onProgress(Math.round(((index + 1) / total) * 95));
  }

  const response = await fetch(`${api}/api/portfolio/upload-finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ upload_id: uploadId, kind, filename: name, content_type: file.type || '' }),
  });
  if (!response.ok) throw new Error(await describeUploadError(response));
  const uploaded = await response.json();
  if (onProgress) onProgress(100);
  return uploaded;
};

export default uploadImageInParts;
