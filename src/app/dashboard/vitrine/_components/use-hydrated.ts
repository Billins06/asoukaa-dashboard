'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * false pendant le rendu serveur et l'hydratation, true ensuite.
 * Sert à n'afficher les dates en heure LOCALE du navigateur qu'une fois
 * côté client (le serveur peut être dans un autre fuseau → sinon
 * erreur d'hydratation).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
