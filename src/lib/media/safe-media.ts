/**
 * Contrôle des adresses de fichiers (pièces d'identité, selfies, photos) avant affichage.
 *
 * Ces adresses sont enregistrées par les candidats (vendeurs / livreurs) : on ne les
 * affiche JAMAIS telles quelles. Une adresse n'est utilisée que si elle a EXACTEMENT
 * la forme d'un fichier émis par la route d'envoi du serveur (POST /upload/:type) :
 *  - http(s) uniquement, sans identifiants (user:pass@), sans fragment ;
 *  - nom de fichier = UUID + extension (jpg, jpeg, png, webp, et pdf pour les pièces) ;
 *  - dossier correspondant au type attendu (documents, selfies, vehicles, products, chat).
 *
 * Fichiers PRIVÉS (documents, selfies) :
 *  - stockage local du serveur → on ne garde que le NOM DE FICHIER, affiché via notre
 *    proxy `/api/kyc/:type/:filename` (jeton admin lu côté serveur, jamais exposé) ;
 *  - URL signée Supabase (https) → affichée directement, mais seulement si son hôte
 *    figure dans UPLOAD_IMAGE_HOSTS (même variable que les images de tickets).
 * Fichiers PUBLICS : affichés directement ; si UPLOAD_IMAGE_HOSTS est renseignée,
 * l'hôte doit en faire partie (liste vide = seul le contrôle de forme s'applique).
 *
 * Module sans dépendance serveur : utilisable par les actions serveur comme par les
 * composants clients.
 */

export type PrivateMediaKind = 'documents' | 'selfies';
export type PublicMediaKind = 'vehicles' | 'products' | 'chat';
export type MediaKind = PrivateMediaKind | PublicMediaKind;

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/** Nom de fichier accepté par le proxy KYC (36 caractères hexa/tirets + extension). */
export const KYC_FILENAME_PATTERN = /^[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp|pdf)$/i;
export const KYC_TYPES: readonly PrivateMediaKind[] = ['documents', 'selfies'];

export function isPrivateKind(kind: MediaKind): kind is PrivateMediaKind {
  return kind === 'documents' || kind === 'selfies';
}

export interface ResolvedMedia {
  /** À mettre dans <img src> / <a href> : chemin du proxy, ou URL directe contrôlée. */
  src: string;
  isPdf: boolean;
  via: 'proxy' | 'direct';
}

function parseHttpUrl(url: unknown): URL | null {
  if (typeof url !== 'string' || url.length === 0 || url.length > 1500) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  if (parsed.username || parsed.password || parsed.hash) return null;
  return parsed;
}

function hostAllowed(parsed: URL, allowedHosts: readonly string[]): boolean {
  if (allowedHosts.length === 0) return true;
  return allowedHosts.includes(parsed.host.toLowerCase());
}

export function resolveMedia(
  url: unknown,
  kind: MediaKind,
  allowedHosts: readonly string[] = [],
): ResolvedMedia | null {
  const parsed = parseHttpUrl(url);
  if (!parsed) return null;
  const path = parsed.pathname;

  if (isPrivateKind(kind)) {
    // 1) Stockage local du serveur : /uploads/<type>/<fichier> ou /api/v1/upload/file/<type>/<fichier>
    //    → on ignore l'hôte et on passe par le proxy (anti-SSRF : le navigateur ne fournit
    //    jamais d'adresse à appeler, seulement un nom de fichier validé).
    if (!parsed.search) {
      const local = new RegExp(`^/(?:uploads|(?:api/v1/)?upload/file)/${kind}/(${UUID}\\.(?:jpe?g|png|webp|pdf))$`, 'i').exec(path);
      if (local) {
        const filename = local[1].toLowerCase();
        return {
          src: `/api/kyc/${kind}/${filename}`,
          isPdf: filename.endsWith('.pdf'),
          via: 'proxy',
        };
      }
    }
    // 2) URL signée Supabase : directe, hôte de confiance OBLIGATOIRE (le jeton de la
    //    signature est dans la requête de l'URL, on ne l'envoie pas à n'importe quel hôte).
    if (parsed.protocol === 'https:' && allowedHosts.length > 0 && hostAllowed(parsed, allowedHosts)) {
      const signed = new RegExp(
        `^/storage/v1/object/(?:sign|authenticated)/[^/]+/${kind}/(${UUID}\\.(?:jpe?g|png|webp|pdf))$`,
        'i',
      ).exec(path);
      if (signed) {
        return { src: parsed.toString(), isPdf: signed[1].toLowerCase().endsWith('.pdf'), via: 'direct' };
      }
    }
    return null;
  }

  // Fichiers publics : jamais de paramètres d'URL, forme stricte, hôte de confiance si configuré.
  if (parsed.search) return null;
  if (!hostAllowed(parsed, allowedHosts)) return null;
  const publicPattern = new RegExp(
    `^/(?:uploads|storage/v1/object/public/[^/]+)/${kind}/${UUID}\\.(?:jpe?g|png|webp)$`,
    'i',
  );
  if (!publicPattern.test(path)) return null;
  return { src: parsed.toString(), isPdf: false, via: 'direct' };
}
