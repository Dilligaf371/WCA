# Guide d'import de personnage D&D Beyond

## ⚠️ Important

D&D Beyond **n'a pas d'API publique officielle**. L'import depuis URL ne fonctionne généralement pas car D&D Beyond bloque les requêtes automatisées.

## ✅ Solution recommandée : Import JSON manuel

### Méthode 1 : Via la Console JavaScript (⭐ Plus simple et fiable)

1. **Ouvrez votre fiche de personnage sur D&D Beyond**
   - Allez sur https://www.dndbeyond.com
   - Connectez-vous à votre compte
   - Ouvrez la fiche du personnage que vous voulez importer

2. **Ouvrez la Console JavaScript**
   - **Sur Mac** : `Cmd+Option+J` (ou `Cmd+Option+I` puis cliquez sur l'onglet "Console")
   - **Sur Windows/Linux** : `F12` puis cliquez sur l'onglet "Console"

3. **Copiez les données du personnage depuis la console**
   - Dans la console, tapez cette commande et appuyez sur Entrée :
   ```javascript
   JSON.stringify(window.__CHARACTER_DATA__ || window.__PRELOADED_STATE__ || window.__INITIAL_STATE__ || document.querySelector('[data-config]')?.dataset?.config || {})
   ```
   - Si ça ne fonctionne pas, essayez :
   ```javascript
   JSON.stringify(window.characterData || window.currentCharacter || {})
   ```
   - Si une erreur apparaît, essayez simplement :
   ```javascript
   document.querySelector('[data-config]')?.dataset?.config
   ```
   - Copiez le résultat affiché (qui sera le JSON)

4. **Si ça ne fonctionne toujours pas**, passez à la Méthode 2 (Network)

### Méthode 2 : Via l'onglet Network (si la méthode 1 ne marche pas)

1. **Ouvrez votre fiche de personnage sur D&D Beyond**
   - Allez sur https://www.dndbeyond.com
   - Connectez-vous à votre compte
   - Ouvrez la fiche du personnage que vous voulez importer

2. **Ouvrez les outils développeur**
   - **Sur Mac** : `Cmd+Option+I`
   - **Sur Windows/Linux** : `F12`
   - Allez dans l'onglet **Network** (Réseau)

3. **Filtrez les requêtes**
   - Cliquez sur le filtre **"Fetch/XHR"** en haut de l'onglet Network
   - Cela affiche uniquement les requêtes de données

4. **Rechargez la page**
   - **Sur Mac** : `Cmd+R`
   - **Sur Windows/Linux** : `F5`

5. **Cherchez une requête avec `characterId`**
   - Dans la liste, cherchez une requête avec `components?characterId=` dans le nom
   - Ou cherchez une requête avec `character` dans l'URL
   - Elle devrait avoir le status **200** (en vert)

6. **Inspectez la réponse**
   - Cliquez sur la requête trouvée
   - Allez dans l'onglet **"Response"** ou **"Preview"**
   - Si vous voyez du JSON avec `id`, `name`, `level`, c'est peut-être utile
   - ⚠️ **Attention** : D&D Beyond charge souvent les données en plusieurs petits morceaux, pas un gros JSON complet

7. **Copiez le JSON**
   - Sélectionnez tout le JSON : **Mac** `Cmd+A` / **Windows/Linux** `Ctrl+A`
   - Copiez : **Mac** `Cmd+C` / **Windows/Linux** `Ctrl+C`

### Étape 2 : Importer dans WarChain Arena

1. **Allez sur la page Personnages**
   - Cliquez sur "Voir mes personnages" dans le Dashboard
   - Ou "Importer un personnage" dans les actions rapides

2. **Ouvrez le formulaire d'import**
   - Cliquez sur "+ Importer un personnage"

3. **Sélectionnez le mode "Depuis JSON"**
   - Cliquez sur l'onglet "Depuis JSON"

4. **Collez le JSON**
   - Collez le JSON copié dans la zone de texte
   - Le JSON doit contenir au minimum un champ `id` avec l'ID du personnage

5. **Cliquez sur "Importer"**
   - Le système va normaliser et importer le personnage

## 📋 Format JSON attendu

Le JSON doit contenir au minimum :
```json
{
  "id": "12345678",
  "name": "Nom du personnage",
  "level": 5,
  ...
}
```

Le système accepte différents formats de JSON D&D Beyond et normalise automatiquement les données.

## 🔍 Aide supplémentaire

Si vous avez des difficultés à trouver le JSON :

1. **Utilisez les filtres Network** :
   - Cliquez sur les boutons de filtre en haut de l'onglet Network
   - Sélectionnez "XHR" ou "Fetch" pour ne voir que les requêtes API
   - Cela réduit le nombre de requêtes à examiner

2. **Utilisez la recherche** :
   - Appuyez sur `Cmd+F` (Mac) ou `Ctrl+F` (Windows/Linux)
   - Cherchez "character" dans les URLs
   - Naviguez entre les résultats avec les flèches

3. **Vérifiez le contenu** :
   - Cliquez sur une requête suspecte
   - Allez dans l'onglet "Preview" ou "Response"
   - Si vous voyez un objet JSON avec `id`, `name`, `level`, `classes`, c'est la bonne !
   - Si vous voyez du HTML, ce n'est pas la bonne requête

4. **Ordre des requêtes** :
   - Les requêtes sont listées par ordre chronologique
   - La requête du personnage apparaît généralement juste après le rechargement de la page
   - Regardez les requêtes avec un timestamp proche du rechargement

## ⚠️ Limitations

- L'import depuis URL ne fonctionne généralement pas (D&D Beyond bloque les requêtes)
- Vous devez être connecté à D&D Beyond pour voir les requêtes réseau
- Les fiches privées nécessitent d'être authentifié dans le navigateur
