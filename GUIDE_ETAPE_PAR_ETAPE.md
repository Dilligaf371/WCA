# Guide Étape par Étape - Import D&D Beyond

## ✅ Vous avez trouvé les requêtes ! Voici quoi faire :

### Dans votre liste Network, vous voyez plusieurs requêtes. Voici les plus importantes :

1. **`37185700?includeCustomItems=true`** ⭐ **C'EST LA PRINCIPALE !**
   - Cette requête contient TOUTES les données complètes du personnage
   - C'est celle que vous devez utiliser en priorité
   - Remplacez `37185700` par votre ID de personnage

2. **`components?characterId=37185700`**
   - ⚠️ **ATTENTION** : Cette requête retourne souvent `data: []` (vide)
   - Elle ne contient PAS les données du personnage
   - Ne l'utilisez PAS si elle est vide

3. Les autres (`items?characterId=...`, `vehicles?characterId=...`, etc.) sont des données partielles

### 📋 Instructions précises :

1. **Cliquez sur la requête `37185700?includeCustomItems=true`**
   - C'est la ligne dans votre liste Network (remplacez 37185700 par votre ID)
   - Cette requête contient les données complètes du personnage

2. **Dans le panneau qui s'ouvre à droite, allez dans l'onglet "Preview" ou "Response"**
   - L'onglet "Preview" affiche le JSON formaté (plus facile à lire)
   - L'onglet "Response" affiche le JSON brut
   - Vous devriez voir un gros objet JSON avec des données (pas vide comme `data: []`)

3. **Sélectionnez tout le JSON**
   - Cliquez dans la zone de texte du JSON
   - **Mac** : `Cmd+A` pour tout sélectionner
   - **Windows** : `Ctrl+A` pour tout sélectionner
   - Faites défiler vers le bas pour vous assurer que tout est sélectionné (le JSON peut être très long)

4. **Copiez le JSON**
   - **Mac** : `Cmd+C`
   - **Windows** : `Ctrl+C`

5. **Dans WarChain Arena**
   - Allez sur votre application
   - Page Personnages → "+ Importer un personnage"
   - Cliquez sur l'onglet **"Depuis JSON"**
   - Collez le JSON (`Cmd+V` ou `Ctrl+V`)
   - Cliquez sur "Importer"

### ⚠️ Si la requête `37185700?includeCustomItems=true` ne fonctionne pas :

- Vérifiez que le JSON n'est pas vide (pas juste `data: []`)
- Si elle est vide, essayez d'autres requêtes avec votre `characterId` dans la liste
- Vous pouvez aussi essayer de combiner plusieurs requêtes (items, spells, etc.) mais c'est plus complexe

### 💡 Astuce

Le JSON peut être très volumineux (plusieurs milliers de lignes). Assurez-vous de bien tout sélectionner avant de copier. Si la sélection ne fonctionne pas bien, vous pouvez :
- Cliquer sur le bouton "Copy" si votre navigateur en a un dans l'onglet Response
- Ou utiliser `Cmd+A` / `Ctrl+A` plusieurs fois pour être sûr que tout est sélectionné
