# Shop Service

Service Express pour enregistrer et consulter les commandes HeroVerse.
Les commandes créées sont enregistrées avec un paiement `unpaid` : aucun
prestataire de paiement n'est configuré et aucune carte bancaire n'est collectée.

## Lancer avec Docker

Le service utilise la clé publique générée par `auth-service`. Lance d'abord l'auth-service au moins une fois en développement afin de générer `auth-service/keys/public.pem`, puis :

```bash
docker compose up --build
```

Endpoints :

- `GET /health`
- `POST /api/orders` — authentification Bearer obligatoire
- `GET /api/orders/me` — authentification Bearer obligatoire

## Lancer localement

```bash
npm install
copy .env.example .env
npm run dev
```

Sur Linux/macOS, remplace `copy` par `cp`.

Le token doit être un access token RS256 produit par `auth-service`. Le middleware vérifie l'émetteur, l'audience et récupère l'identifiant utilisateur depuis la propriété JWT `sub`.

Le frontend appelle `http://localhost:3003` par défaut. Pour une autre adresse,
définis `VITE_SHOP_API_URL` dans l'environnement Vite. L'utilisateur doit être
connecté pour enregistrer une commande.
