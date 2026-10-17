'use server';

import { unstable_rethrow } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getVendorById } from '@/lib/vendors/api';
import { getAgentById } from '@/lib/agents/api';
import { getUploadImageHosts } from '@/lib/support/api';
import { resolveMedia, type MediaKind } from '@/lib/media/safe-media';
import type { KycMediaItem, KycTarget } from '@/lib/media/kyc-types';
import type { ActionResult } from '@/types/api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toItem(
  key: string,
  label: string,
  url: unknown,
  kind: MediaKind,
  hosts: readonly string[],
): KycMediaItem {
  if (typeof url !== 'string' || url.trim() === '') return { key, label, status: 'missing' };
  const media = resolveMedia(url.trim(), kind, hosts);
  if (!media) return { key, label, status: 'unsafe' };
  return { key, label, status: 'ok', src: media.src, isPdf: media.isPdf };
}

/**
 * Pièces jointes d'une candidature vendeur / livreur, avec des adresses CONTRÔLÉES.
 *
 * Pourquoi relire la fiche par identifiant plutôt que d'utiliser la liste « en attente » ?
 *  - l'onglet « Tous » (liste paginée) ne contient pas les documents ;
 *  - le serveur renouvelle alors les URL signées des documents privés (elles expirent
 *    au bout de 7 jours) ;
 *  - les adresses sont contrôlées ici, côté serveur, où la liste des hôtes autorisés
 *    (UPLOAD_IMAGE_HOSTS) est connue — le navigateur n'a jamais à la connaître.
 */
export async function getKycMediaAction(
  target: KycTarget,
  id: string,
): Promise<ActionResult<KycMediaItem[]>> {
  // L'identifiant est inséré dans le chemin de l'appel serveur : UUID uniquement.
  if (!UUID_RE.test(id)) return { success: false, error: 'Identifiant invalide.' };

  const hosts = getUploadImageHosts();

  try {
    if (target === 'vendor') {
      const v = (await getVendorById(id)) as unknown as {
        idDocumentUrl?: unknown;
        selfieUrl?: unknown;
        sampleProductUrls?: unknown;
      };
      const samples = Array.isArray(v?.sampleProductUrls) ? v.sampleProductUrls : [];
      const items: KycMediaItem[] = [
        toItem('id', "Pièce d'identité", v?.idDocumentUrl, 'documents', hosts),
        toItem('selfie', 'Selfie', v?.selfieUrl, 'selfies', hosts),
        // 12 photos d'exemple au plus : au-delà ce n'est plus une vérification
        ...samples.slice(0, 12).map((u, i) => toItem(`sample-${i}`, `Photo d'exemple ${i + 1}`, u, 'products', hosts)),
      ];
      return { success: true, data: items };
    }

    const a = (await getAgentById(id)) as unknown as {
      idDocumentUrl?: unknown;
      selfieUrl?: unknown;
      vehiclePhotoUrl?: unknown;
    };
    return {
      success: true,
      data: [
        toItem('id', "Pièce d'identité", a?.idDocumentUrl, 'documents', hosts),
        toItem('selfie', 'Selfie', a?.selfieUrl, 'selfies', hosts),
        toItem('vehicle', 'Photo du véhicule', a?.vehiclePhotoUrl, 'vehicles', hosts),
      ],
    };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) return { success: false, error: error.message };
    return { success: false, error: 'Impossible de charger les pièces jointes.' };
  }
}
