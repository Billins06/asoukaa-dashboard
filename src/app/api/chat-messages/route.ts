import { type NextRequest, NextResponse } from 'next/server';
import { api, ApiError } from '@/lib/api';

// Jamais mis en cache : la réponse dépend de la session de l'admin.
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Statut renvoyé au navigateur selon l'erreur du serveur (le 401 est transmis tel quel). */
function statusFor(error: ApiError): number {
  switch (error.status) {
    case 400:
    case 401:
    case 403:
    case 404:
      return error.status;
    case 408:
      return 504;
    case 0:
      return 502;
    default:
      return error.status >= 500 ? 502 : 500;
  }
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 });

  // L'id est inséré dans le chemin de l'appel backend : on n'accepte qu'un
  // UUID (pas de "../", de "?" ni d'autre segment de chemin).
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
  }

  try {
    // redirectOn401:false → ici on répond au navigateur (fetch), pas à une page :
    // une redirection serait suivie en silence et masquerait la session expirée.
    const data = await api.get(`/chat/reported/${id}/messages`, { redirectOn401: false });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: statusFor(error) });
    }
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
