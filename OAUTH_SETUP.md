# Configuration OAuth (Google & Apple)

## Statut actuel

L'authentification OAuth est **partiellement implémentée** :
- ✅ Backend routes créées (`/auth/google`, `/auth/apple`)
- ✅ Service d'authentification OAuth créé
- ✅ Schéma Prisma mis à jour pour supporter OAuth
- ✅ Handlers frontend ajoutés
- ❌ SDK OAuth non configurés (Google Sign-In, Apple Sign In)

## Pour activer complètement l'OAuth

### Google Sign-In

1. **Créer un projet Google Cloud** :
   - Aller sur https://console.cloud.google.com
   - Créer un nouveau projet
   - Activer "Google+ API"

2. **Configurer OAuth 2.0** :
   - Aller dans "APIs & Services" > "Credentials"
   - Créer "OAuth 2.0 Client ID"
   - Configurer les autorised redirect URIs :
     - `http://localhost:3001` (dev)
     - Votre domaine de production

3. **Installer le SDK frontend** :
   ```bash
   cd frontend
   npm install @react-oauth/google
   ```

4. **Configurer dans le frontend** :
   ```tsx
   // Dans src/main.tsx ou App.tsx
   import { GoogleOAuthProvider } from '@react-oauth/google';

   <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
     <App />
   </GoogleOAuthProvider>
   ```

5. **Mettre à jour LoginPage.tsx** :
   ```tsx
   import { useGoogleLogin } from '@react-oauth/google';

   const login = useGoogleLogin({
     onSuccess: async (tokenResponse) => {
       // Récupérer les infos utilisateur
       const userInfo = await axios.get(
         'https://www.googleapis.com/oauth2/v3/userinfo',
         { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
       );
       
       // Envoyer au backend
       const response = await axios.post(`${API_URL}/auth/google`, {
         providerId: userInfo.data.sub,
         email: userInfo.data.email,
         name: userInfo.data.name,
       });
     },
   });
   ```

### Apple Sign In

1. **Créer un App ID sur Apple Developer** :
   - Aller sur https://developer.apple.com
   - Créer un App ID avec "Sign in with Apple" activé

2. **Configurer Service ID** :
   - Créer un Service ID
   - Configurer les domains et redirect URLs

3. **Installer le SDK frontend** :
   ```bash
   cd frontend
   npm install @invertase/react-native-apple-authentication
   # Ou pour web: utiliser la bibliothèque Apple appropriée
   ```

4. **Mettre à jour LoginPage.tsx** :
   ```tsx
   // Utiliser le SDK Apple approprié
   const handleAppleLogin = async () => {
     const response = await AppleAuthentication.signIn();
     await axios.post(`${API_URL}/auth/apple`, {
       providerId: response.user,
       email: response.email,
       name: response.fullName,
     });
   };
   ```

## Note importante

Pour l'instant, les boutons OAuth affichent un message indiquant que l'OAuth n'est pas configuré. Une fois les SDK configurés, les handlers fonctionneront automatiquement avec le backend existant.

## Structure backend

Le backend accepte les endpoints suivants :
- `POST /api/auth/google` - Accepte `{ providerId, email, name }`
- `POST /api/auth/apple` - Accepte `{ providerId, email, name }`

Le service `authService.loginWithOAuth()` :
- Crée un nouvel utilisateur si inexistant
- Connecte un utilisateur existant
- Gère le lien entre compte email/password et compte OAuth (si même email)
