/**
 * Événement navigateur : demande au menu latéral de recharger ses pastilles
 * (ex. juste après avoir traité une alerte de sécurité).
 */
export const SIDEBAR_REFRESH_EVENT = 'asoukaa:sidebar-refresh';

export function requestSidebarRefresh(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SIDEBAR_REFRESH_EVENT));
  }
}
