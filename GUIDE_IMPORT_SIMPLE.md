# Guide d'import simple - D&D Beyond

## 🎯 Méthode la plus simple

### Étape 1 : Ouvrir la fiche sur D&D Beyond
1. Allez sur https://www.dndbeyond.com
2. Connectez-vous
3. Ouvrez votre fiche de personnage

### Étape 2 : Copier le code source
1. **Sur Mac** : Appuyez sur `Cmd+Option+U`
   **Sur Windows/Linux** : Appuyez sur `Ctrl+U`
   
   (Ou clic droit → "Afficher le code source de la page")

### Étape 3 : Chercher le JSON
1. Dans le code source, appuyez sur `Cmd+F` (Mac) ou `Ctrl+F` (Windows)
2. Cherchez : `characterId` ou `"character":` ou `__PRELOADED_STATE__`
3. Le JSON commence généralement après un `=` ou `:`
4. Sélectionnez tout le JSON (peut être très long!)
5. Copiez : `Cmd+C` (Mac) ou `Ctrl+C` (Windows)

### Étape 4 : Importer dans WarChain Arena
1. Allez sur votre application WarChain Arena
2. Page Personnages → "+ Importer un personnage"
3. Cliquez sur l'onglet **"Depuis JSON"**
4. Collez le JSON copié
5. Cliquez sur "Importer"

## ⚠️ Si ça ne marche pas

Le JSON peut être très volumineux ou dans un format différent. Dans ce cas :
- Utilisez la méthode Network (voir GUIDE_IMPORT_DETAIL.md)
- Ou contactez le support pour obtenir un format d'export alternatif
