# Configuration Apple Sign In

Ce guide explique comment configurer Apple Sign In pour votre application Warchain Arena.

## Prérequis

- Un compte Apple Developer (99$/an)
- Accès au portail Apple Developer (https://developer.apple.com)

## Étapes de configuration

### 1. Créer un Services ID

1. Connectez-vous à votre compte [Apple Developer](https://developer.apple.com/account/)
2. Allez dans **Certificates, Identifiers & Profiles**
3. Dans la barre latérale, cliquez sur **Identifiers**
4. Cliquez sur le bouton **+** pour ajouter un nouvel identifiant
5. Sélectionnez **Services ID** et cliquez sur **Continue**
6. Entrez une description (ex: "Warchain Arena Web")
7. Entrez un identifiant unique (ex: `com.warchain.arena.web`)
8. Cliquez sur **Continue**, puis sur **Register**

### 2. Configurer Sign In with Apple pour le Services ID

1. Dans la liste des Identifiers, sélectionnez votre Services ID
2. Cochez la case **Sign in with Apple**
3. Cliquez sur **Configure**
4. Dans la fenêtre qui s'affiche :
   - Sélectionnez votre **Primary App ID** (ou créez-en un si nécessaire)
   - Sous **Website URLs**, ajoutez :
     - **Domains and Subdomains** : Votre domaine (ex: `warchain-arena.com` ou `localhost` pour le développement)
     - **Return URLs** : 
       - Pour le développement : `http://localhost:5173` (ou le port de votre serveur de dev)
       - Pour la production : `https://votre-domaine.com`
   - Cliquez sur **Done**
5. Cliquez sur **Continue**, puis sur **Save**

### 3. Générer une clé privée (optionnel pour le web)

Pour l'authentification web avec popup, vous n'avez généralement pas besoin de clé privée côté client. La clé privée est nécessaire côté serveur si vous voulez vérifier les tokens côté backend.

Si vous voulez vérifier les tokens côté backend :

1. Dans **Certificates, Identifiers & Profiles**, allez dans **Keys**
2. Cliquez sur le bouton **+** pour créer une nouvelle clé
3. Donnez un nom à votre clé (ex: "Warchain Arena Apple Sign In Key")
4. Cochez la case **Sign in with Apple**
5. Cliquez sur **Configure** et sélectionnez votre Primary App ID
6. Cliquez sur **Save**, puis sur **Continue**
7. Cliquez sur **Register**
8. **IMPORTANT** : Téléchargez la clé privée (.p8) et conservez-la en lieu sûr, car vous ne pourrez plus la télécharger plus tard
9. Notez le **Key ID** affiché

### 4. Configurer les variables d'environnement

Créez ou modifiez votre fichier `.env` dans le dossier `frontend/` :

```env
# Apple Sign In Configuration
VITE_APPLE_CLIENT_ID=com.warchain.arena.web
VITE_APPLE_REDIRECT_URI=http://localhost:5173
```

Pour la production :

```env
VITE_APPLE_CLIENT_ID=com.warchain.arena.web
VITE_APPLE_REDIRECT_URI=https://votre-domaine.com
```

**Remplacez `com.warchain.arena.web` par votre Services ID créé à l'étape 1.**

### 5. Redémarrer le serveur de développement

Après avoir configuré les variables d'environnement, redémarrez votre serveur de développement :

```bash
cd frontend
npm run dev
```

## Notes importantes

- **Services ID** : C'est l'identifiant que vous devez utiliser comme `VITE_APPLE_CLIENT_ID`
- **Domaines** : Apple vérifie que le domaine correspond à celui configuré dans Apple Developer
- **Return URLs** : Doivent correspondre exactement (protocole, domaine, port)
- **Développement local** : Vous pouvez utiliser `localhost` comme domaine dans Apple Developer
- **Première connexion** : Apple fournit l'email et le nom seulement lors de la première connexion. Les connexions suivantes ne fourniront que l'ID utilisateur (sub) dans le token JWT.

## Dépannage

### Erreur "invalid_client"

- Vérifiez que votre `VITE_APPLE_CLIENT_ID` correspond exactement à votre Services ID
- Vérifiez que Sign In with Apple est bien configuré pour votre Services ID
- Vérifiez que votre domaine est bien configuré dans Apple Developer

### Erreur "redirect_uri_mismatch"

- Vérifiez que votre `VITE_APPLE_REDIRECT_URI` correspond exactement à une des Return URLs configurées dans Apple Developer
- Vérifiez le protocole (http vs https), le domaine, et le port

### Popup qui ne s'ouvre pas

- Vérifiez que le SDK Apple est bien chargé (vérifiez la console du navigateur)
- Vérifiez que votre domaine n'est pas bloqué par les bloqueurs de publicité
- Testez dans un navigateur Safari ou Chrome

## Ressources

- [Documentation Apple - Sign in with Apple for the web](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js)
- [Guide Apple - Configure Sign in with Apple for the web](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/)
