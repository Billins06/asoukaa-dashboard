import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE, type UploadImageType } from './constants';

/**
 * Envoie une image via la Route Handler `/api/upload/:type` (même origine,
 * le cookie d'auth httpOnly est joint automatiquement) et renvoie l'URL publique.
 * Utilisable depuis un Client Component. Lève une Error au message lisible.
 */
export async function uploadImage(file: File, type: UploadImageType): Promise<string> {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error('Format non autorisé. Formats acceptés : JPG, PNG, WEBP.');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image trop volumineuse (5 Mo maximum).');
  }

  const fd = new FormData();
  fd.append('file', file);

  let res: Response;
  try {
    res = await fetch(`/api/upload/${type}`, { method: 'POST', body: fd });
  } catch {
    throw new Error("Échec de l'envoi : réseau indisponible.");
  }

  const data = (await res.json().catch(() => null)) as { url?: unknown; message?: unknown } | null;
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : `Erreur HTTP ${res.status}`);
  }
  if (typeof data?.url !== 'string' || !data.url) {
    throw new Error('Réponse inattendue du serveur.');
  }
  return data.url;
}
