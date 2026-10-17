/**
 * Adresse web sûre à afficher dans un lien ou une image : http(s) uniquement, sans
 * identifiants (user:pass@). Renvoie null sinon (ex. « javascript:... », « data:... »).
 * Module sans dépendance serveur : utilisable partout.
 */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2000) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}
