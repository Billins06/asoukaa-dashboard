import { z } from 'zod';

/**
 * Règles du mot de passe admin — IDENTIQUES à celles du serveur
 * (SetAdminPasswordDto / ResetPasswordDto) : 8 à 64 caractères avec au moins
 * une minuscule, une majuscule, un chiffre et un caractère spécial.
 *
 * Fichier partagé (ni 'use server' ni 'use client') : un fichier 'use server' ne
 * peut exporter que des fonctions asynchrones, et le formulaire (navigateur) comme
 * l'action serveur doivent appliquer EXACTEMENT les mêmes règles.
 */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/;

export const PASSWORD_COMPLEXITY_MESSAGE =
  'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial';

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(64, 'Le mot de passe ne doit pas dépasser 64 caractères')
  .regex(PASSWORD_PATTERN, PASSWORD_COMPLEXITY_MESSAGE);
