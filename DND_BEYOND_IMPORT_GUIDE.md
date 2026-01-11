# Guide d'import D&D Beyond

## Problème actuel

D&D Beyond n'a **pas d'API publique officielle**. Les méthodes d'import peuvent varier et certaines peuvent ne pas fonctionner.

## Options disponibles

### Option 1 : Fiche publique avec endpoint JSON (recommandé si disponible)

1. Rendez la fiche de personnage **publique** sur D&D Beyond
2. Utilisez l'URL : `https://www.dndbeyond.com/characters/{id}` ou `https://www.dndbeyond.com/profile/{username}/characters/{id}`
3. Le système tentera d'accéder à `{url}/json`

**Limitation** : D&D Beyond peut bloquer les requêtes automatisées même pour les fiches publiques.

### Option 2 : Import manuel JSON (à implémenter)

1. Ouvrez la fiche de personnage sur D&D Beyond
2. Utilisez les outils de développement du navigateur (F12)
3. Trouvez la requête API qui charge les données du personnage
4. Copiez le JSON retourné
5. Collez-le dans un formulaire d'import JSON (à créer)

### Option 3 : Service tiers (ex: Avrae, World Anvil)

Certains services tiers ont des intégrations avec D&D Beyond via authentification OAuth. Cela nécessiterait :
- Intégration OAuth avec D&D Beyond
- Accès API via token d'authentification

## Solution recommandée pour MVP

Pour un MVP, la meilleure approche est d'ajouter un **import manuel JSON** :

1. L'utilisateur exporte manuellement les données depuis D&D Beyond
2. Colle le JSON dans un formulaire
3. Le backend importe directement depuis le JSON fourni

Cela évite les problèmes de CORS, d'authentification, et de blocus des requêtes automatisées.
