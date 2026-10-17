import { type NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { getAccessToken } from '@/lib/auth';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE,
  UPLOAD_TYPES,
  type UploadImageType,
} from '@/lib/upload/constants';

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // navigateurs anciens / requêtes même origine sans en-tête
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '')
    .split(',')[0]
    .trim();
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Relais d'envoi d'image vers le backend (POST /upload/:type, multipart, champ `file`).
 *
 * Pourquoi une Route Handler et pas une Server Action ?
 *  - les Server Actions sont limitées à 1 Mo de corps par défaut,
 *    alors que le backend accepte jusqu'à 5 Mo ;
 *  - le jeton reste dans le cookie httpOnly : il est lu ici, côté serveur,
 *    exactement comme le fait `lib/api.ts`.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  // Anti-CSRF : même contrôle que les Server Actions (Origin == hôte servi).
  // Le cookie est en sameSite=lax, ceci ferme la porte aux envois inter-sites.
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: 'Origine de la requête refusée.' }, { status: 403 });
  }

  const { type } = await params;
  if (!UPLOAD_TYPES.includes(type as UploadImageType)) {
    return NextResponse.json({ message: "Type d'envoi non autorisé." }, { status: 400 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json(
      { message: 'Session expirée. Reconnectez-vous.' },
      { status: 401 },
    );
  }

  // Refus AVANT de lire le corps : formData() charge tout en mémoire.
  // Marge de 64 Ko pour l'enveloppe multipart. Corps sans longueur
  // déclarée (envoi « chunked ») : refusé, le navigateur l'indique toujours.
  const declared = Number(request.headers.get('content-length') ?? NaN);
  if (!Number.isFinite(declared) || declared > MAX_IMAGE_SIZE + 64 * 1024) {
    return NextResponse.json(
      { message: 'Image trop lourde ou taille inconnue.' },
      { status: 413 },
    );
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get('file');
  } catch {
    return NextResponse.json({ message: 'Requête invalide.' }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: 'Aucun fichier reçu.' }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { message: 'Format non autorisé. Formats acceptés : JPG, PNG, WEBP.' },
      { status: 400 },
    );
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { message: 'Image trop volumineuse (5 Mo maximum).' },
      { status: 400 },
    );
  }

  const forward = new FormData();
  forward.append('file', file, file.name);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/upload/${type}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      body: forward,
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const data: unknown = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      const raw = (data as { message?: unknown } | null)?.message;
      const message =
        response.status === 404
          ? "L'envoi d'image n'est pas encore disponible côté serveur."
          : Array.isArray(raw)
          ? raw.join(', ')
          : typeof raw === 'string' && raw
          ? raw
          : `Erreur HTTP ${response.status}`;
      return NextResponse.json({ message }, { status: response.status });
    }

    const url = (data as { url?: unknown } | null)?.url;
    if (typeof url !== 'string' || !url) {
      return NextResponse.json(
        { message: 'Réponse inattendue du serveur (URL manquante).' },
        { status: 502 },
      );
    }
    return NextResponse.json({ url });
  } catch (error) {
    clearTimeout(timeoutId);
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Délai dépassé. Le serveur ne répond pas.'
        : 'Serveur injoignable.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
