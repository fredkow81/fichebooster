# Shopify SEO Optimizer

SaaS d'optimisation SEO automatique de fiches produit Shopify : connexion boutique, analyse d'image produit par IA, génération de mot-clé principal, titre, meta title/description, variantes traduites, description longue structurée et maillage interne — avec validation humaine obligatoire avant toute publication sur Shopify.

## Sommaire

- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Connecter une boutique Shopify](#connecter-une-boutique-shopify)
- [Lancer le projet](#lancer-le-projet)
- [Tester l'optimisation d'un produit](#tester-loptimisation-dun-produit)
- [Abonnements & interface admin](#abonnements--interface-admin)
- [Tests automatisés](#tests-automatisés)
- [Structure du projet](#structure-du-projet)
- [Sécurité](#sécurité)
- [Limitations connues](#limitations-connues)

## Architecture

```
Utilisateur
   │
   ▼
Next.js App Router (UI + API routes)
   │
   ├── Auth (NextAuth, credentials + JWT)
   │
   ├── Shopify service layer (src/lib/shopify)
   │      GraphQL Admin API ⇄ fixtures (mode démo)
   │
   ├── AI service layer (src/lib/ai)
   │      Prompt vision+texte ⇄ OpenAI (GPT-4o) ⇄ fixtures (mode démo)
   │      → JSON structuré strict (Zod)
   │
   ├── SEO layer (src/lib/seo)
   │      Scoring, validation des règles, détection de cannibalisation
   │
   └── PostgreSQL (Prisma)
          User, Store, ProductSnapshot, ProductOptimization,
          KeywordRecommendation, InternalLinkRecommendation,
          OptimizationHistory
```

Flux fonctionnel : connexion boutique → sélection produit → formulaire d'orientation (niche, collection, marché, langue, ton, objectif) → analyse IA (image + texte) → JSON structuré → écran de validation entièrement éditable → publication Shopify **uniquement après confirmation explicite** → historique.

Le SaaS ne modifie **jamais** une fiche produit Shopify sans validation humaine (voir [`/api/optimizations/[id]/publish`](src/app/api/optimizations/[id]/publish/route.ts)).

## Stack technique

- **Frontend** : Next.js 14 (App Router), TypeScript strict, Tailwind CSS, Radix UI
- **Backend** : API routes Next.js
- **Base de données** : PostgreSQL + Prisma ORM
- **Auth** : NextAuth (credentials, sessions JWT)
- **Shopify** : Admin API GraphQL (2024-10)
- **IA** : OpenAI GPT-4o (vision + texte, Structured Outputs), architecture pluggable (`AiProvider`)
- **Validation** : Zod partout (entrées API, sortie IA, formulaires)
- **Tests** : Vitest

## Installation

### 1. Prérequis

- Node.js ≥ 20
- PostgreSQL (local, Docker, ou service managé)

### 2. Cloner et installer les dépendances

```bash
npm install
```

### 3. Démarrer PostgreSQL

Avec Docker (le plus simple) :

```bash
docker compose up -d
```

Ou pointez `DATABASE_URL` vers une base PostgreSQL existante.

### 4. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Voir la section [Variables d'environnement](#variables-denvironnement) pour le détail de chaque clé.

### 5. Initialiser la base de données

```bash
npx prisma migrate dev --name init
npm run db:seed
```

Le seed crée un compte de démonstration et une boutique factice (utile en mode démo, voir plus bas) :

```
Email    : demo@shopify-seo-optimizer.local
Password : demo12345
```

### 6. Lancer le serveur

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Toutes les variables sont validées au démarrage via [`src/lib/env.ts`](src/lib/env.ts) (Zod) — l'application refuse de démarrer si une variable requise est manquante ou mal formée.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `NEXTAUTH_SECRET` | Secret de signature des sessions JWT (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL publique de l'app (`http://localhost:3000` en local) |
| `TOKEN_ENCRYPTION_KEY` | Clé AES-256 (64 caractères hex) utilisée pour chiffrer les tokens Shopify en base (`openssl rand -hex 32`) |
| `SHOPIFY_API_VERSION` | Version de l'Admin API GraphQL utilisée |
| `SHOPIFY_MOCK_MODE` | `true` = aucune boutique réelle requise, données Shopify simulées (voir plus bas) |
| `OPENAI_API_KEY` | Clé API OpenAI, requise si `AI_MOCK_MODE=false` |
| `AI_MODEL` | Modèle OpenAI utilisé pour l'analyse vision + texte |
| `AI_MOCK_MODE` | `true` = optimisation générée par un provider déterministe local, sans appel API |
| `UPLOAD_DIR`, `UPLOAD_TTL_MINUTES`, `MAX_UPLOAD_SIZE_MB` | Paramètres de stockage temporaire des images produit |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (Dashboard → Developers → API keys), requise si `STRIPE_MOCK_MODE=false` |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature du endpoint `/api/webhooks/stripe` (Dashboard → Developers → Webhooks) |
| `STRIPE_MOCK_MODE` | `true` = checkout/portail/création de plan simulés en base, sans appel Stripe réel |
| `ADMIN_EMAILS` | Emails (séparés par virgules) auto-promus administrateur à la connexion/inscription |

Les tokens Shopify ne sont **jamais** stockés en clair : ils sont chiffrés (AES-256-GCM) avant écriture en base via [`src/lib/crypto.ts`](src/lib/crypto.ts).

## Connecter une boutique Shopify

### Mode démo (par défaut, `SHOPIFY_MOCK_MODE=true` / `AI_MOCK_MODE=true`)

Aucune boutique ni clé API réelle n'est nécessaire : la couche Shopify (`src/lib/shopify/service.ts`) retourne des données de démonstration (produits, collections, variantes) et la couche IA (`src/lib/ai/mock-provider.ts`) génère une optimisation cohérente et déterministe à partir de ces données. C'est le mode idéal pour explorer l'application de bout en bout sans configuration externe.

Pour connecter une "boutique" en mode démo, utilisez n'importe quelle adresse au format `nom-boutique.myshopify.com` et un token quelconque dans le formulaire de connexion (`/stores`) — la vérification de connexion est simulée.

### Mode production (boutique Shopify réelle)

Shopify a remplacé l'ancien token statique par le **Dev Dashboard** : les apps personnalisées fournissent désormais un **Client ID + Client Secret**, échangés contre un token d'accès Admin API via le **client_credentials grant** (valable ~24h, renouvelé automatiquement par l'app — voir `src/lib/shopify/service.ts`).

⚠️ Cette méthode ne fonctionne que si l'app et la boutique appartiennent à la **même organisation Shopify** — parfaite pour connecter votre propre boutique de test, mais **pas utilisable pour de futurs clients tiers** (qui nécessiteront le flux OAuth complet, non implémenté ici).

1. Dans l'admin de la boutique : `https://admin.shopify.com/store/VOTRE-BOUTIQUE/settings/apps/development` (ou **Paramètres → Apps et canaux de vente → Développer des apps**)
2. **Créer une app**, onglet **Configuration** → **Admin API** → cochez au minimum `read_products`, `write_products`, `read_product_listings` → **Enregistrer**
3. Onglet **Identifiants API** → **Installer l'app**
4. Toujours sur cet onglet, notez le **Client ID** et le **Client Secret** (bouton pour le révéler)
5. Dans `.env` (ou les variables Vercel), passez `SHOPIFY_MOCK_MODE=false`
6. Dans l'application, allez sur `/stores` et renseignez : adresse (`nom-boutique.myshopify.com`), Client ID, Client Secret
7. Pour activer l'analyse IA réelle (vision + texte), passez `AI_MOCK_MODE=false` et renseignez `OPENAI_API_KEY`.

La connexion est testée en direct (échange de token + requête GraphQL `shop`) avant d'être enregistrée ; toute erreur (identifiants invalides, boutique hors organisation, domaine incorrect) est affichée clairement à l'utilisateur. Seul le Client Secret est chiffré en base (`encryptedClientSecret`) ; le token d'accès à courte durée de vie est mis en cache chiffré (`encryptedAccessToken` / `accessTokenExpiresAt`) et rafraîchi automatiquement.

Source : [Shopify Dev — Client credentials grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant)

## Lancer le projet

```bash
npm run dev        # serveur de développement
npm run build       # build de production
npm run start        # démarrage en production (après build)
npm run typecheck    # vérification TypeScript stricte
npm run lint         # ESLint
```

## Tester l'optimisation d'un produit

1. Connectez-vous avec le compte de démo (voir [Installation](#installation)) ou créez un compte via le lien "Créer un compte" sur `/login`.
2. Si aucune boutique n'est connectée, allez sur `/stores` et connectez-en une (mode démo : n'importe quelles valeurs).
3. Allez sur `/products`, choisissez un produit puis cliquez sur **Optimiser la fiche produit**.
4. Renseignez le formulaire d'orientation (niche, collection, marché, langue, ton, objectif) et cliquez sur **Lancer l'analyse IA**.
5. L'IA analyse les images et les données du produit, puis génère : mot-clé principal, handle optimisé, 3 titres, meta title/description, variantes traduites, description HTML ≥ 600 mots avec maillage interne, et un score SEO avant/après.
6. Sur l'écran de validation (`/optimizations/[id]`), modifiez librement chaque champ, régénérez l'optimisation si besoin, puis :
   - **Enregistrer en brouillon** pour sauvegarder sans publier
   - **Publier sur Shopify** pour ouvrir la modale de confirmation (avec avertissement si l'URL du produit change), puis appliquer les changements validés sur la fiche Shopify réelle.
7. Consultez `/history` pour voir l'historique complet des optimisations (ancien/nouveau titre, handle, meta description, statut, auteur).

## Abonnements & interface admin

Chaque utilisateur a toujours exactement un abonnement (`Subscription`), créé à l'inscription sur le plan marqué `isDefault: true` (le plan **Gratuit** par défaut : 1 boutique / 3 optimisations par mois — modifiable depuis l'admin). Les limites sont appliquées côté serveur avant toute création de boutique ou d'optimisation (`src/lib/billing/limits.ts`) ; un dépassement renvoie une erreur claire (HTTP 402).

### Devenir administrateur

Ajoutez votre email à `ADMIN_EMAILS` dans `.env` (local) ou dans les variables d'environnement Vercel (production), puis reconnectez-vous (la promotion se fait à la connexion — voir `src/lib/auth.ts`). Le lien **Administration** apparaît alors dans le menu, donnant accès à `/admin` :

- **Vue d'ensemble** : nombre d'utilisateurs, abonnements actifs, MRR estimé, répartition par plan
- **Utilisateurs** : liste complète, changement manuel de plan/rôle par utilisateur (utile pour un compte offert ou un support client, sans passer par Stripe)
- **Plans** : création/édition des paliers tarifaires (Starter/Pro/Business...). La création d'un plan payant crée automatiquement le Product + Price Stripe correspondant. **Le prix n'est plus modifiable après création** (les Price Stripe sont immuables) — créez un nouveau plan pour changer un tarif.

### Mode démo vs Stripe réel

Par défaut `STRIPE_MOCK_MODE=true` : la page `/billing`, le checkout, le portail client et la création de plans fonctionnent entièrement en simulant les écritures en base, sans compte Stripe. Pour passer en production avec de vrais paiements :

1. Créez un compte sur [dashboard.stripe.com](https://dashboard.stripe.com), récupérez la clé secrète (`STRIPE_SECRET_KEY`)
2. Ajoutez un endpoint webhook pointant vers `https://votre-domaine/api/webhooks/stripe`, écoutant au minimum `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` — copiez le secret de signature dans `STRIPE_WEBHOOK_SECRET`
3. Passez `STRIPE_MOCK_MODE=false`
4. Les plans déjà créés en mode mock ont des identifiants Stripe factices (`mock_price_...`) — recréez-les depuis `/admin/plans` une fois en mode réel pour qu'ils pointent vers de vrais Price Stripe

## Tests automatisés

```bash
npm run test
```

Couvre notamment (voir `src/lib/**/*.test.ts`) :

- Longueur du titre (≤ 70 caractères) et de la meta description (≤ 160 caractères)
- Description ≥ 600 mots
- Validité du handle (slug)
- Présence des deux liens internes (collection + produit similaire)
- Traduction des variantes (ex: `Black` → interdit si non traduit)
- Détection de cannibalisation de mot-clé (doublon exact, similarité forte)
- Score d'intention transactionnelle
- Validité stricte du JSON retourné par l'IA (schéma Zod)
- Calcul du score SEO (0–100) avant/après
- Logique de limite de plan (`isOverLimit`, illimité vs plafonné)

## Structure du projet

```
src/
  app/
    (app)/              pages protégées (dashboard, stores, products, history, settings, optimizations, billing)
    (admin)/             pages réservées aux administrateurs (/admin, /admin/users, /admin/plans)
    api/                 routes API (auth, stores, optimizations, history, keyword, seo, billing, admin, webhooks)
    login/                page de connexion / inscription
  components/            composants UI réutilisables + primitives (src/components/ui)
  lib/
    shopify/              client GraphQL, requêtes, mutations, service, fixtures (mode démo)
    ai/                    prompt builder, schéma JSON strict, provider OpenAI + mock
    seo/                   scoring, validateurs, détection de cannibalisation
    stripe/                client Stripe, checkout/portail/plans, sync webhook (+ mode mock)
    billing/               limites d'usage par plan
    validations/           schémas Zod des entrées API/formulaires
    api/                   helpers session/auth/erreurs pour les routes API (dont requireAdmin)
prisma/
  schema.prisma           modèles de données (dont Plan, Subscription)
  seed.ts                 compte démo + plan gratuit + backfill des utilisateurs existants
```

## Sécurité

- Tokens Shopify chiffrés (AES-256-GCM) avant stockage, jamais journalisés en clair.
- Toutes les routes API vérifient la session et l'appartenance de la ressource (`requireUserId`, `requireOwnedStore`, `requireOwnedOptimization`) — aucun accès cross-tenant possible.
- Toute entrée utilisateur est validée par Zod avant d'atteindre la base de données ou l'API Shopify.
- **Aucune écriture Shopify n'a lieu sans validation explicite de l'utilisateur** : la route `/api/optimizations/[id]/publish` revalide toutes les règles SEO (longueurs, mots requis, liens internes) avant d'appeler l'Admin API.
- Les erreurs Shopify (token invalide, rate limit, etc.) sont interceptées et traduites en messages compréhensibles côté UI.
- Les images produit envoyées à l'IA sont limitées en nombre et en taille (voir `src/lib/ai/image-utils.ts`) pour éviter les abus.
- Les routes `/api/admin/*` et le groupe de pages `(admin)` vérifient le rôle `ADMIN` côté serveur (`requireAdmin()` + double vérification dans le layout) — jamais uniquement côté client.
- Le webhook Stripe vérifie la signature HMAC (`stripe-signature`) sur le corps brut de la requête avant tout traitement ; toute requête non signée ou mal signée est rejetée (400).

## Limitations connues

- **Next.js 14.2.35 / next-auth 4** : quelques avis de sécurité npm restent ouverts sur ces lignes majeures (correctifs disponibles uniquement en migrant vers Next 15/16 et Auth.js v5, changements non triviaux). À planifier avant une mise en production exposée publiquement — exécutez `npm audit` pour le détail.
- Les intégrations externes de volume de recherche (Google Search Console, Google Ads Keyword Planner, Semrush, Ahrefs, DataForSEO) ne sont pas connectées : le score d'intention transactionnelle et la détection de cannibalisation reposent sur une heuristique interne (voir `src/lib/seo/keyword.ts`), conçue pour être remplacée/complétée par ces API sans changer l'interface `AiProvider`.
- Le rendu HTML de la description produit (aperçu et fiche Shopify) fait confiance au contenu généré par l'IA, cadré strictement par le prompt (balises autorisées limitées) et toujours revu par l'utilisateur avant publication.
