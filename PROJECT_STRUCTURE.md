# Structure du Projet - Warchain Arena Platform

## 📁 Structure Complète

```
warchain-arena-platform/
│
├── 📂 src/                          # BACKEND - Code source TypeScript
│   ├── server.ts                    # Point d'entrée du serveur Express
│   ├── config/                      # Configuration
│   │   ├── database.ts              # Configuration Prisma/PostgreSQL
│   │   ├── env.ts                   # Variables d'environnement
│   │   └── redis.ts                 # Configuration Redis
│   ├── middleware/                  # Middleware Express
│   │   ├── auth.ts                  # Authentification JWT
│   │   └── ownership.ts             # Vérification de propriété
│   ├── routes/                      # Routes API
│   │   ├── auth.ts                  # Routes d'authentification
│   │   ├── characters.ts            # Routes des personnages
│   │   ├── figurines.ts             # Routes des figurines
│   │   └── nfts.ts                  # Routes des NFTs
│   ├── services/                    # Services métier
│   │   ├── authService.ts           # Service d'authentification
│   │   ├── dndBeyondImporter.ts     # Import depuis D&D Beyond
│   │   ├── figurineService.ts       # Service des figurines
│   │   ├── ipfsService.ts           # Service IPFS
│   │   └── nftService.ts            # Service NFTs
│   ├── types/                       # Types TypeScript
│   │   └── dndBeyond.ts             # Types D&D Beyond
│   └── utils/                       # Utilitaires
│       └── crypto.ts                # Fonctions cryptographiques
│
├── 📂 frontend/                     # FRONTEND - Application React
│   ├── src/
│   │   ├── App.tsx                  # Composant racine
│   │   ├── main.tsx                 # Point d'entrée
│   │   ├── components/              # Composants React
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── CharactersPage.tsx
│   │   │   ├── AnimatedBackground.tsx
│   │   │   └── ...
│   │   └── ...
│   ├── public/                      # Assets statiques
│   ├── package.json                 # Dépendances frontend
│   └── vite.config.ts               # Configuration Vite
│
├── 📂 prisma/                       # Base de données
│   ├── schema.prisma                # Schéma de base de données
│   └── migrations/                  # Migrations
│
├── 📂 dist/                         # Code compilé (généré)
│   └── ...                          # Fichiers JavaScript compilés
│
├── package.json                     # Dépendances backend
├── tsconfig.json                    # Configuration TypeScript backend
├── .env.example                     # Exemple de variables d'environnement
└── README.md                        # Documentation
```

## 🔍 Où se trouve le BACKEND ?

Le backend se trouve dans le dossier **`src/`** à la racine du projet.

### Fichiers Backend Principaux :

1. **`src/server.ts`** - Point d'entrée principal
   - Démarre le serveur Express
   - Configure CORS, rate limiting
   - Définit les routes API

2. **`src/routes/`** - Routes API
   - `auth.ts` - `/api/auth/*`
   - `characters.ts` - `/api/characters/*`
   - `figurines.ts` - `/api/figurines/*`
   - `nfts.ts` - `/api/nfts/*`

3. **`src/services/`** - Logique métier
   - `authService.ts` - Authentification
   - `dndBeyondImporter.ts` - Import D&D Beyond
   - Autres services...

4. **`src/config/`** - Configuration
   - `database.ts` - Prisma client
   - `env.ts` - Variables d'environnement
   - `redis.ts` - Redis client

## 🚀 Commandes Backend

```bash
# Développement
npm run dev              # Lance le serveur en mode watch

# Production
npm run build           # Compile TypeScript → JavaScript dans dist/
npm start               # Lance le serveur compilé (dist/server.js)

# Base de données
npm run prisma:generate # Génère le client Prisma
npm run prisma:migrate  # Exécute les migrations
npm run prisma:studio   # Interface graphique Prisma
```

## 📍 Port par défaut

Le backend s'exécute sur le **port 3000** par défaut :
- URL : `http://localhost:3000`
- API : `http://localhost:3000/api`
- Health check : `http://localhost:3000/health`

## ⚙️ Variables d'Environnement Backend

Créer un fichier `.env` à la racine avec :

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/warchain_arena

# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# Polygon (optionnel)
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_PRIVATE_KEY=0x...

# Redis (optionnel)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 🔄 Workflow Backend

1. **Développement** :
   ```bash
   npm run dev
   ```
   - Utilise `tsx watch` pour recompiler automatiquement
   - Fichiers dans `src/` sont compilés à la volée

2. **Production** :
   ```bash
   npm run build  # Compile src/ → dist/
   npm start      # Lance dist/server.js
   ```
   - Code TypeScript compilé en JavaScript
   - Fichiers JavaScript dans `dist/`

## 📝 Notes

- Le dossier `dist/` contient le code compilé (généré automatiquement)
- Ne pas modifier directement les fichiers dans `dist/`
- Toujours modifier les fichiers dans `src/`
- Le code est compilé avec TypeScript (`tsc`)
