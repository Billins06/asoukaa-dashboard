import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine des classes Tailwind en gérant les conflits.
 *
 * Usage : <div className={cn('p-2 text-red-500', isError && 'bg-red-100')} />
 *
 * clsx → gère les booléens, undefined, arrays, objets
 * twMerge → résout les conflits Tailwind (p-2 + p-4 = p-4 garde le dernier)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
