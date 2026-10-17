/** Pièce jointe d'une candidature, prête à afficher (adresse déjà contrôlée côté serveur). */
export interface KycMediaItem {
  key: string;
  /** Libellé affiché, ex. « Pièce d'identité » */
  label: string;
  /**
   * - ok      : adresse valide, affichable ;
   * - missing : le candidat n'a rien fourni ;
   * - unsafe  : une adresse existe mais elle n'a pas la forme d'un fichier de notre
   *             serveur (ou son hôte n'est pas autorisé) : on ne l'affiche pas.
   */
  status: 'ok' | 'missing' | 'unsafe';
  src?: string;
  isPdf?: boolean;
}

export type KycTarget = 'vendor' | 'agent';
