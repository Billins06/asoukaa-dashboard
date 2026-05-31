# Asoukaa Dashboard Admin

Dashboard d'administration de la marketplace **Asoukaa** (Bénin / Afrique de l'Ouest).
Application web séparée qui communique avec le backend NestJS via API REST.

## 🧱 Stack technique

- **Framework** : Next.js 14+ (App Router) + TypeScript
- **UI** : Tailwind CSS + shadcn/ui
- **Graphiques** : Recharts
- **Auth** : JWT stocké en cookie httpOnly (Server Actions)
- **HTTP** : Fetch natif (côté serveur) + Axios (côté client via Route Handlers)
- **State client** : Zustand (user state) + TanStack Query (server state)
- **Validation formulaires** : react-hook-form + zod
- **Langue** : Français
- **Cible** : Desktop first

---

## 🚀 Setup initial (à faire UNE FOIS)

### 1. Créer le projet Next.js

```bash
# Dans le dossier parent où tu veux ton projet
npx create-next-app@latest asoukaa-dashboard \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack

cd asoukaa-dashboard
```

Réponds **No** si l'outil demande "Would you like to use Turbopack?".

### 2. Installer les dépendances supplémentaires

```bash
# Auth / sécurité
npm install jose

# State & data
npm install zustand @tanstack/react-query @tanstack/react-query-devtools

# Formulaires
npm install react-hook-form @hookform/resolvers zod

# UI utils
npm install clsx tailwind-merge class-variance-authority lucide-react

# Graphiques
npm install recharts

# Notifications
npm install sonner

# Format de dates en français
npm install date-fns
```

### 3. Initialiser shadcn/ui

```bash
npx shadcn@latest init
```

Réponses recommandées :
- Style : **Default**
- Base color : **Neutral**
- CSS variables : **Yes**

### 4. Ajouter les composants shadcn nécessaires pour la Phase 1

```bash
npx shadcn@latest add button input label card form sonner avatar dropdown-menu separator skeleton
```

### 5. Copier les fichiers de ce starter

Remplace / ajoute les fichiers fournis dans ce dossier (`src/`, `middleware.ts`, etc.) dans ton projet.

### 6. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Édite `.env.local` avec ta vraie URL backend.

### 7. Lancer le serveur

```bash
npm run dev
```

Ouvre [http://localhost:3001](http://localhost:3001) (port modifiable dans `package.json`).

---

## 🔒 Architecture de sécurité

### JWT en httpOnly cookie — pourquoi ?

| Stockage | Lisible JS | Vulnérable XSS | Vulnérable CSRF |
|---|---|---|---|
| `localStorage` | ✅ Oui | ❌ **Très** | ✅ Non |
| `sessionStorage` | ✅ Oui | ❌ **Très** | ✅ Non |
| Cookie httpOnly | ❌ Non | ✅ **Protégé** | ⚠️ Oui (mitigé via SameSite) |

Le JWT est inaccessible au JavaScript du navigateur → un script malveillant injecté (XSS) **ne peut pas voler le token**. La protection CSRF est assurée par `SameSite=Lax` (par défaut Next.js) + Origin check côté backend.

### Flux d'authentification

```
1. User soumet le form de login (client component)
2. → appelle Server Action "loginAction"
3. → Server Action appelle POST /api/v1/auth/login (backend NestJS)
4. → backend renvoie { accessToken, refreshToken, user }
5. → Server Action stocke accessToken en cookie httpOnly via next/headers
6. → User redirigé vers /dashboard
7. Chaque page protégée (Server Component) lit le cookie et l'envoie en Bearer au backend
```

### Protection des routes

Le `middleware.ts` intercepte toutes les requêtes vers `/(dashboard)/*` :
- Lit le cookie `asoukaa_access_token`
- Vérifie sa présence (validation cryptographique optionnelle via `jose`)
- Redirige vers `/login` si absent ou invalide

---

## 📂 Structure du projet

```
asoukaa-dashboard/
├── middleware.ts                    ← Protection des routes
├── .env.local                       ← Variables d'env (NE PAS COMMIT)
├── .env.local.example               ← Template versionné
├── src/
│   ├── app/
│   │   ├── layout.tsx               ← Root layout (Providers, Toaster)
│   │   ├── page.tsx                 ← Redirige vers /login ou /dashboard
│   │   ├── globals.css              ← Tailwind + design tokens
│   │   ├── (auth)/                  ← Group sans layout dashboard
│   │   │   ├── layout.tsx
│   │   │   └── login/page.tsx
│   │   └── (dashboard)/             ← Routes protégées
│   │       ├── layout.tsx           ← Sidebar + Header
│   │       └── page.tsx             ← Dashboard home (placeholder Phase 2)
│   ├── components/
│   │   ├── auth/login-form.tsx
│   │   └── layout/{sidebar,header,nav-items}.tsx
│   ├── lib/
│   │   ├── api.ts                   ← Client HTTP (server-side)
│   │   ├── auth.ts                  ← Helpers cookies/JWT
│   │   ├── constants.ts             ← Brand, config app
│   │   ├── utils.ts                 ← cn() pour Tailwind
│   │   └── providers.tsx            ← React Query + Theme
│   ├── server/actions/
│   │   └── auth-actions.ts          ← Server Actions login/logout
│   ├── stores/auth-store.ts         ← Zustand (user info client)
│   ├── hooks/use-auth.ts
│   └── types/{auth,api}.ts
└── package.json
```

---

## ⚠️ À vérifier avant la production

| Point | Détail |
|---|---|
| Variables d'env | Toutes les `NEXT_PUBLIC_*` sont exposées au navigateur. Ne **JAMAIS** y mettre de secret |
| CORS | Le backend NestJS doit whitelister l'URL du dashboard (ex : `https://admin.asoukaa.com`) |
| Cookie domain | En prod, configurer `domain` du cookie pour partage si sous-domaine commun |
| Cookie secure | Mettre `secure: true` en HTTPS prod (déjà géré conditionnellement dans le code) |
| Rate limiting | Limiter `/login` côté backend pour éviter le brute-force |
| Logs sensibles | Aucun token ne doit apparaître dans les logs (Server Actions, console) |
| HTTPS obligatoire | Sans HTTPS, le cookie peut être intercepté |
| Refresh token | À implémenter en Phase 1.5 ou Phase 2 selon besoin |

---

## 📞 Connexion backend

URL backend par défaut : `http://localhost:3000/api/v1`

Endpoints utilisés en Phase 1 :
- `POST /auth/login` → `{ identifier, password }` → `{ accessToken, refreshToken?, user }`
- `POST /auth/logout` (optionnel) → invalide côté serveur
- `GET /auth/me` → retourne le profil de l'admin connecté

Si tes endpoints diffèrent, modifie `src/server/actions/auth-actions.ts` et `src/lib/api.ts`.
