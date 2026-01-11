# Configuration D&D Beyond Authentication

## Statut actuel

**D&D Beyond n'offre pas actuellement d'API OAuth publique** pour l'authentification tierce.

La structure backend et frontend est préparée pour une intégration future, mais **l'authentification D&D Beyond n'est pas fonctionnelle pour le moment**.

## Structure préparée

### Backend

- ✅ Route `/auth/dndbeyond` créée dans `src/routes/auth.ts`
- ✅ Service `authService.loginWithOAuth()` supporte le provider `'dndbeyond'`
- ✅ Schéma Prisma supporte `provider: 'dndbeyond'`

### Frontend

- ✅ Bouton "Sign in with D&D Beyond" dans `LoginPage.tsx`
- ✅ Handler `handleDndBeyondLogin()` préparé
- ⚠️ **Actuellement** : Affiche un message d'erreur expliquant que D&D Beyond n'a pas d'API publique

## Options pour l'authentification D&D Beyond

### Option 1 : Contact D&D Beyond (Recommandé)

Pour obtenir l'accès à l'API D&D Beyond, vous devez :

1. **Contacter D&D Beyond** pour demander un partenariat ou un accès API
   - Email : support@dndbeyond.com ou via leur site web
   - Expliquer votre projet et votre besoin d'intégration
   
2. **Obtenir les credentials OAuth** (si disponible)
   - Client ID
   - Client Secret
   - Authorization URL
   - Token URL
   - User Info URL
   - Redirect URI

3. **Implémenter le flow OAuth** dans `handleDndBeyondLogin()` :
   ```typescript
   // Redirection vers D&D Beyond
   window.location.href = `https://dndbeyond.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=email profile`
   
   // Dans la page de callback
   const code = new URLSearchParams(window.location.search).get('code')
   // Échanger le code contre un token
   // Récupérer les infos utilisateur
   // Envoyer au backend
   ```

### Option 2 : Utiliser le compte D&D Beyond existant (Non recommandé)

Si un utilisateur a déjà un compte D&D Beyond, vous pourriez :

1. Demander à l'utilisateur de se connecter avec son email/password D&D Beyond
2. Utiliser cette information pour créer un compte dans votre plateforme
3. ⚠️ **Attention** : Cela nécessiterait que l'utilisateur partage ses credentials, ce qui n'est pas sécurisé

### Option 3 : Attendre une API publique (À long terme)

D&D Beyond pourrait publier une API OAuth dans le futur. Surveillez leurs annonces.

## Exemples d'intégrations tierces

Certaines applications ont obtenu l'accès à l'API D&D Beyond :
- **The Forge VTT** : A reçu l'autorisation d'utiliser l'API de D&D Beyond pour permettre aux utilisateurs d'accéder au contenu qu'ils possèdent

Ces intégrations sont généralement le résultat de partenariats ou d'accords spécifiques avec D&D Beyond.

## Code préparé

Le code suivant est prêt à être utilisé lorsque D&D Beyond OAuth sera disponible :

**Frontend (`LoginPage.tsx`)** :
```typescript
const handleDndBeyondLogin = async () => {
  // TODO: Implémenter le flow OAuth D&D Beyond
  // 1. Redirection vers D&D Beyond
  // 2. Callback avec code
  // 3. Échange code contre token
  // 4. Récupération user info
  // 5. Envoi au backend
  
  const response = await axios.post(`${API_URL}/auth/dndbeyond`, {
    providerId: dndBeyondUser.id,
    email: dndBeyondUser.email,
    name: dndBeyondUser.name,
  })
  const { user, token } = response.data.data
  onLogin(user, token)
}
```

**Backend (`src/routes/auth.ts`)** :
```typescript
router.post('/dndbeyond', async (req: Request, res: Response) => {
  const { providerId, email, name } = req.body;
  const result = await authService.loginWithOAuth('dndbeyond', providerId, email, name);
  res.json({ success: true, data: result });
});
```

## Prochaines étapes

1. **Contacter D&D Beyond** pour demander l'accès API
2. **Implémenter le flow OAuth** une fois les credentials obtenus
3. **Tester l'intégration** avec les credentials fournis
4. **Documenter** le processus pour votre équipe

## Ressources

- [Site web D&D Beyond](https://www.dndbeyond.com/)
- [Support D&D Beyond](https://www.dndbeyond.com/support)
- [Exemple d'intégration : The Forge VTT](https://forums.forge-vtt.com/t/how-are-you-able-to-offer-d-d-beyond-integration/15393)
