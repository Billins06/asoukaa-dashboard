/** Types d'envoi d'image autorisés depuis le dashboard (POST /upload/:type). */
export const UPLOAD_TYPES = ['vitrine', 'categories', 'tickets'] as const;
export type UploadImageType = (typeof UPLOAD_TYPES)[number];

export const ALLOWED_IMAGE_MIME_TYPES: string[] = ['image/jpeg', 'image/png', 'image/webp'];

/** Aligné sur MAX_FILE_SIZE par défaut du backend (5 Mo). */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
