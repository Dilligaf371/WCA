# Guide Rapide - Import D&D Beyond

## 🎯 Méthode Network (Recommandée)

### Étapes rapides :

1. **Ouvrir la fiche** sur https://www.dndbeyond.com/characters/[VOTRE_ID]

2. **Ouvrir DevTools**
   - Mac : `Cmd+Option+I`
   - Windows : `F12`

3. **Aller dans Network**
   - Cliquer sur l'onglet **Network**
   - Cliquer sur le filtre **"Fetch/XHR"**
   - Dans la recherche en haut, taper : `character-service` ou `characterId`

4. **Recharger la page**
   - Mac : `Cmd+R`
   - Windows : `F5`

5. **Trouver la requête**
   - Chercher une requête avec `character-service.dndbeyond.com` ou `components?characterId=`
   - Status doit être **200** (vert)
   - Taille importante (plusieurs KB)

6. **Copier le JSON**
   - Cliquer sur la requête
   - Aller dans l'onglet **"Response"**
   - `Cmd+A` (Mac) ou `Ctrl+A` (Windows) pour tout sélectionner
   - `Cmd+C` (Mac) ou `Ctrl+C` (Windows) pour copier

7. **Importer dans WarChain Arena**
   - Aller sur votre app WarChain Arena
   - Personnages → "+ Importer un personnage"
   - Onglet **"Depuis JSON"**
   - Coller et cliquer sur "Importer"

## 💡 Astuce

Si vous ne voyez pas la requête après le rechargement :
- Assurez-vous que le filtre "Fetch/XHR" est actif
- Utilisez la recherche avec `characterId` pour filtrer
- Essayez de défilement dans la liste des requêtes
- La requête peut apparaître quelques secondes après le chargement de la page
