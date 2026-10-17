import { type NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { getAccessToken } from '@/lib/auth';
import { KYC_FILENAME_PATTERN, KYC_TYPES, type PrivateMediaKind } from '@/lib/media/safe-media';

/**
 * Relais des pièces privées (pièce d'identité, selfie) : GET /api/kyc/:type/:filename.
 *
 * Pourquoi un relais ?
 *  - ces fichiers sont protégés côté serveur (jeton obligatoire) : une simple balise
 *    <img> ne peut pas envoyer le jeton, qui est dans un cookie httpOnly illisible par
 *    le navigateur. Le jeton est donc lu ICI, côté serveur, comme dans lib/api.ts ;
 *  - anti-SSRF : le navigateur ne fournit JAMAIS d'adresse. Il envoie un type (liste
 *    fermée) et un nom de fichier (format UUID + extension validé), et c'est ce
 *    route qui construit l'adresse du backend à partir de API_BASE_URL.
 *
 * Réponse : contenu du fichier, type MIME déduit de l'extension (on ne fait pas
 * confiance à l'en-tête du serveur), jamais mis en cache (`private, no-store`).
 */

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

const TIMEOUT_MS = 20_000;

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } },
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; filename: string }> },
) {
  const { type, filename } = await params;

  if (!KYC_TYPES.includes(type as PrivateMediaKind)) {
    return jsonError('Type de fichier non autorisé.', 400);
  }
  if (!KYC_FILENAME_PATTERN.test(filename)) {
    return jsonError('Nom de fichier invalide.', 400);
  }

  // Session obligatoire (cookie). Sa validité réelle est vérifiée par le serveur ci-dessous.
  const token = await getAccessToken();
  if (!token) return jsonError('Session expirée. Reconnectez-vous.', 401);

  const ext = filename.split('.').pop()!.toLowerCase();
  const contentType = MIME_BY_EXT[ext];
  if (!contentType) return jsonError('Format de fichier non pris en charge.', 400);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // type et filename ont été validés ci-dessus (liste fermée + motif strict) : aucun
    // caractère de chemin ou de requête ne peut s'y glisser.
    const upstream = await fetch(`${API_CONFIG.baseUrl}/upload/file/${type}/${filename}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!upstream.ok || !upstream.body) {
      clearTimeout(timeoutId);
      if (upstream.status === 401 || upstream.status === 403) {
        return jsonError('Accès refusé au fichier.', upstream.status);
      }
      if (upstream.status === 404) return jsonError('Fichier introuvable.', 404);
      return jsonError('Le serveur de fichiers a répondu par une erreur.', 502);
    }

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Referrer-Policy': 'no-referrer',
    };
    // Un PDF ouvert dans un onglet est rendu par le lecteur du navigateur : la politique
    // « sandbox » ci-dessous le bloquerait. Pour les images, elle interdit tout script
    // qui s'y cacherait (ex. fichier SVG/HTML déguisé).
    if (contentType !== 'application/pdf') {
      headers['Content-Security-Policy'] = "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox";
    }
    const length = upstream.headers.get('content-length');
    if (length && /^\d+$/.test(length)) headers['Content-Length'] = length;

    // Le délai ne couvre que l'obtention des en-têtes : le corps est ensuite relayé en flux.
    clearTimeout(timeoutId);
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error) {
    clearTimeout(timeoutId);
    const aborted = error instanceof Error && error.name === 'AbortError';
    return jsonError(aborted ? 'Délai dépassé. Le serveur ne répond pas.' : 'Serveur injoignable.', 502);
  }
}
