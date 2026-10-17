/**
 * Contrôle des URLs d'images de tickets avant affichage.
 *
 * Les pièces jointes sont fournies par des utilisateurs : on ne les affiche
 * que si elles ont EXACTEMENT la forme d'un fichier émis par la route
 * d'envoi du backend (POST /upload/tickets) : http(s), sans identifiants,
 * sans paramètres ni fragment, chemin « …/tickets/<uuid>.(jpg|png|webp) ».
 * Si une liste d'hôtes est fournie (variable serveur UPLOAD_IMAGE_HOSTS),
 * l'hôte doit en faire partie.
 *
 * Ce module est volontairement sans dépendance serveur : il est utilisé
 * aussi bien par les Server Actions que par les composants clients.
 */
const TICKET_FILE_PATH =
  /(?:^|\/)tickets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpe?g|png|webp)$/i;

export function isTrustedTicketImage(url: unknown, allowedHosts?: readonly string[] | null): url is string {
  if (typeof url !== 'string' || url.length === 0 || url.length > 500) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
  if (parsed.username || parsed.password || parsed.search || parsed.hash) return false;
  if (!TICKET_FILE_PATH.test(parsed.pathname)) return false;
  if (allowedHosts && allowedHosts.length > 0) {
    const host = parsed.host.toLowerCase();
    if (!allowedHosts.includes(host)) return false;
  }
  return true;
}
