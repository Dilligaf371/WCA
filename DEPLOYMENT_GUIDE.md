# Guide de Déploiement - Warchain Arena Platform

## 🚀 Options de Déploiement

Pour une application full-stack avec backend Node.js et frontend React, voici les meilleures options :

---

## Option 1 : Railway (Recommandé - Le Plus Simple) ⭐

**Railway** est excellent pour les applications full-stack car il gère automatiquement :
- Déploiement du backend Node.js
- Déploiement du frontend (build statique)
- Base de données PostgreSQL
- Redis (optionnel)
- Variables d'environnement
- HTTPS automatique

### Étapes de déploiement sur Railway

1. **Créer un compte**
   - Allez sur https://railway.app
   - Créez un compte (connexion avec GitHub recommandée)

2. **Nouveau projet depuis GitHub**
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repository `WCA`
   - Railway détectera automatiquement le projet

3. **Ajouter PostgreSQL**
   - Dans votre projet, cliquez sur "New" → "Database" → "Add PostgreSQL"
   - Railway créera automatiquement une base de données
   - Notez la `DATABASE_URL` qui sera générée

4. **Configurer le Backend**
   - Railway aura détecté votre projet Node.js
   - Ajoutez ces variables d'environnement dans "Variables" :

```env
# Database (généré automatiquement par Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server
PORT=3000
NODE_ENV=production

# JWT (GÉNÉREZ UN SECRET FORT - min 32 caractères)
JWT_SECRET=votre-secret-jwt-super-securise-minimum-32-caracteres
JWT_EXPIRES_IN=7d

# Polygon (si vous utilisez la blockchain)
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_PRIVATE_KEY=votre-cle-privee

# IPFS (optionnel)
IPFS_API_URL=https://api.pinata.cloud
IPFS_JWT_TOKEN=votre-token-pinata

# CORS (remplacez par votre domaine Railway)
CORS_ORIGIN=https://votre-projet.railway.app

# Redis (optionnel - ajoutez Redis service si nécessaire)
REDIS_URL=${{Redis.REDIS_URL}}
```

5. **Configurer le Build du Backend**
   - Dans les settings du service backend :
   - **Root Directory**: `/` (racine)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Watch Paths**: `src/**`

6. **Déployer le Frontend (Service séparé)**
   - Ajoutez un nouveau service : "Empty Service"
   - Connectez-le au même repository
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx vite preview --host 0.0.0.0 --port $PORT`
   - Ajoutez la variable d'environnement :
     ```env
     VITE_API_URL=https://votre-backend.railway.app/api
     ```

7. **Exposer les services**
   - Pour le backend : Settings → Generate Domain (ex: `wca-api.railway.app`)
   - Pour le frontend : Settings → Generate Domain (ex: `wca.railway.app`)
   - Utilisez le domaine frontend pour `CORS_ORIGIN`

8. **Exécuter les migrations**
   - Dans Railway, ouvrez la console (Terminal)
   - Exécutez :
     ```bash
     npm run prisma:generate
     npm run prisma:migrate deploy
     ```

---

## Option 2 : Render (Gratuit avec limitations)

**Render** offre un plan gratuit avec quelques limitations (le service s'endort après inactivité).

### Étapes pour Render

1. **Créer un compte**
   - https://render.com
   - Connexion avec GitHub

2. **Déployer PostgreSQL**
   - Dashboard → "New +" → "PostgreSQL"
   - Notez la `Internal Database URL`

3. **Déployer le Backend (Web Service)**
   - "New +" → "Web Service"
   - Connectez votre repository GitHub
   - Configuration :
     - **Name**: `wca-backend`
     - **Root Directory**: `/`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
   - Variables d'environnement (identique à Railway)
   - Générer un domaine (ex: `wca-backend.onrender.com`)

4. **Déployer le Frontend (Static Site)**
   - "New +" → "Static Site"
   - Connectez votre repository GitHub
   - Configuration :
     - **Root Directory**: `frontend`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `frontend/dist`
   - Variable d'environnement :
     ```env
     VITE_API_URL=https://wca-backend.onrender.com/api
     ```

5. **Exécuter les migrations**
   - Utilisez la console SSH de Render ou un script de migration

---

## Option 3 : Vercel (Frontend) + Railway/Render (Backend)

**Vercel** est excellent pour le frontend React, combiné avec Railway/Render pour le backend.

### Étapes

1. **Déployer le Backend** (Railway ou Render, voir Option 1 ou 2)

2. **Déployer le Frontend sur Vercel**
   - https://vercel.com
   - "New Project" → Importez depuis GitHub
   - Configuration :
     - **Root Directory**: `frontend`
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Variable d'environnement :
     ```env
     VITE_API_URL=https://votre-backend.railway.app/api
     ```
   - Vercel générera automatiquement un domaine (ex: `wca.vercel.app`)

---

## Option 4 : DigitalOcean App Platform

Payant mais très stable et performant.

1. **Créer un compte** : https://www.digitalocean.com
2. **App Platform** → "Create App" → Connectez GitHub
3. Configurez backend et frontend comme services séparés
4. Ajoutez une base de données PostgreSQL gérée

---

## 🔧 Préparation Avant Déploiement

### 1. Créer un fichier `.env.example` (si pas déjà fait)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/warchain_arena

# Server
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# Polygon
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_PRIVATE_KEY=0x...

# IPFS (optionnel)
IPFS_API_URL=https://api.pinata.cloud
IPFS_JWT_TOKEN=your-pinata-jwt

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Redis (optionnel)
REDIS_URL=redis://localhost:6379
```

### 2. Générer un secret JWT fort

```bash
# Dans votre terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Vérifier le build localement

```bash
# Backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

### 4. Mettre à jour le README avec les URLs de production

---

## 📝 Checklist de Déploiement

- [ ] Compte créé sur la plateforme choisie
- [ ] Repository GitHub connecté
- [ ] Base de données PostgreSQL créée
- [ ] Variables d'environnement configurées
- [ ] JWT_SECRET généré (min 32 caractères)
- [ ] CORS_ORIGIN configuré avec le bon domaine
- [ ] VITE_API_URL configuré dans le frontend
- [ ] Migrations de base de données exécutées
- [ ] Build du backend réussi
- [ ] Build du frontend réussi
- [ ] HTTPS activé (automatique sur Railway/Render/Vercel)
- [ ] Tests de connexion (login, import personnage)
- [ ] Logs vérifiés (pas d'erreurs)

---

## 🐛 Problèmes Courants

### Erreur de connexion à la base de données
- Vérifiez que `DATABASE_URL` est correcte
- Vérifiez que les migrations ont été exécutées
- Vérifiez que la base de données est accessible depuis le service

### Erreur CORS
- Vérifiez que `CORS_ORIGIN` correspond exactement au domaine frontend
- Incluez le protocole (`https://`)
- Pas de slash à la fin

### Frontend ne peut pas se connecter au backend
- Vérifiez que `VITE_API_URL` est correct
- Les variables `VITE_*` doivent être définies au moment du build
- Rebuild le frontend après modification de `VITE_API_URL`

### Migrations échouent
- Exécutez `prisma generate` avant les migrations
- Utilisez `prisma migrate deploy` pour la production (pas `prisma migrate dev`)

---

## 🎯 Recommandation

**Pour commencer rapidement** : Utilisez **Railway**
- Gratuit au début (crédits mensuels)
- Configuration simple
- PostgreSQL inclus
- HTTPS automatique
- Excellent pour le développement et les projets moyens

**Pour la production/scale** : Combinez **Vercel (frontend)** + **Railway (backend)**
- Vercel est gratuit et excellent pour React
- Railway pour le backend avec PostgreSQL

---

## 📚 Ressources

- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Prisma Deployment**: https://www.prisma.io/docs/guides/deployment

---

## 🔐 Sécurité en Production

1. **Ne jamais commiter** `.env` ou secrets
2. Utiliser des secrets forts (JWT_SECRET min 32 caractères)
3. Activer HTTPS (automatique sur Railway/Render/Vercel)
4. Limiter CORS aux domaines autorisés uniquement
5. Activer le rate limiting (déjà configuré dans le code)
6. Surveiller les logs pour détecter les erreurs
7. Sauvegarder régulièrement la base de données
