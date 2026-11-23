# Chat Service — HeroVerse

Service de chat temps réel : **Node.js + Express + Socket.IO + MongoDB**.

Le service réutilise l'authentification de `auth-service` : les access tokens
JWT **RS256** sont vérifiés avec sa clé publique, côté REST comme côté Socket.IO.
Aucun compte n'est dupliqué dans MongoDB.

## Fonctionnalités

- Authentification JWT (handshake Socket.IO + `Authorization: Bearer` sur le REST)
- Liste et création de rooms (persistées dans MongoDB)
- Rejoindre / quitter une room
- Envoi et réception de messages en temps réel
- Historique des messages (les N derniers, rechargé à l'ouverture d'une room)
- Liste des utilisateurs connectés par room (multi-onglets géré)
- Indicateur « en train d'écrire » avec expiration automatique
- Anti-spam simple : 10 messages / 10 s par socket
- Docker Compose prêt à l'emploi (service + MongoDB)

## Arborescence

```
chat-service/
├─ package.json
├─ Dockerfile
├─ docker-compose.yml
├─ .env.example
├─ README.md
└─ src/
   ├─ server.js                  # HTTP + Socket.IO + shutdown propre
   ├─ app.js                     # Express, CORS, /health, routes, erreurs
   ├─ config/
   │  ├─ env.js                  # variables d'environnement
   │  ├─ db.js                   # connexion Mongoose
   │  └─ jwt.js                  # vérification RS256
   ├─ middlewares/auth.middleware.js
   ├─ models/{Room,Message}.js
   ├─ routes/room.routes.js
   ├─ controllers/room.controller.js
   ├─ services/{room,message,presence}.service.js
   ├─ sockets/
   │  ├─ index.js                # io + auth du handshake
   │  └─ chat.handler.js         # join/leave/message/typing/présence
   └─ utils/{constants,errors,serialize,slug}.js
```

## Prérequis

- Node.js 20+
- Docker + Docker Compose
- `auth-service` démarré (Postgres) pour créer un compte et se connecter
- Clé publique présente : `auth-service/keys/public.pem`

## Démarrage local

### 1. Auth-service

```bash
cd auth-service
docker compose up -d
```

### 2. Chat-service

```bash
cd chat-service
cp .env.example .env
npm install
npm run dev
```

Le service écoute sur `http://localhost:3002`.

```bash
curl http://localhost:3002/health
# { "status": "ok", "db": "connected" }
```

> `JWT_PUBLIC_KEY_PATH=../auth-service/keys/public.pem` est résolu depuis
> `chat-service/`. Lance donc les commandes depuis ce dossier.

### 3. Frontend

```bash
# à la racine du projet
npm install
npm run dev
```

Le frontend utilise `VITE_CHAT_API_URL` (défaut : `http://localhost:3002`).
Crée un `.env` à la racine si besoin :

```bash
VITE_CHAT_API_URL=http://localhost:3002
VITE_AUTH_API_URL=http://localhost:3001
```

Connecte-toi via `/auth-preview.html?mode=login`, puis ouvre la section **Chat**.

## Docker

```bash
cd chat-service
docker compose up --build -d
docker compose logs -f chat-service
docker compose down
```

| Conteneur | Détail |
|---|---|
| `heroverse-chat` | API + Socket.IO, port `${CHAT_PORT:-3002}` |
| `heroverse-chat-mongo` | `mongo:7`, volume `chat_mongo_data`, non exposé sur l'hôte |

La clé publique est montée en lecture seule :
`../auth-service/keys/public.pem` → `/app/keys/public.pem`.

L'historique MongoDB est conservé entre les redémarrages (`docker compose down`
sans `-v`).

## Variables d'environnement

Voir `.env.example`.

| Variable | Défaut | Rôle |
|---|---|---|
| `NODE_ENV` | `development` | Environnement |
| `PORT` | `3002` | Port HTTP |
| `MONGO_URI` | `mongodb://localhost:27017/heroverse_chat` | Connexion MongoDB |
| `CORS_ORIGIN` | `http://localhost:5173` | Origines autorisées (virgules) |
| `JWT_ISSUER` | `heroverse-auth` | Émetteur attendu |
| `JWT_AUDIENCE` | `heroverse-services` | Audience attendue |
| `JWT_PUBLIC_KEY_PATH` | `../auth-service/keys/public.pem` | Clé publique RS256 |
| `JWT_PUBLIC_KEY` | — | Clé PEM inline (prioritaire, utile en cloud) |
| `MESSAGE_HISTORY_LIMIT` | `100` | Taille max de l'historique |
| `CHAT_PORT` | `3002` | Port publié par Docker Compose |
| `MONGO_DB` | `heroverse_chat` | Nom de la base Mongo dans Docker |

## API REST

Toutes les routes `/api/*` exigent un access token :

```http
Authorization: Bearer <accessToken>
```

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/health` | État du service et de MongoDB (public) |
| `GET` | `/api/rooms` | Rooms + `messageCount`, `lastMessage`, `onlineCount` |
| `POST` | `/api/rooms` | Créer une room |
| `GET` | `/api/rooms/:id/messages?limit=100` | Derniers messages (max 200), ordre chronologique |

### Créer une room

```bash
curl -X POST http://localhost:3002/api/rooms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Captain Meteor","universe":"Vault Comics","description":"Théories et origines"}'
```

```json
{
  "room": {
    "id": "captain-meteor",
    "name": "Captain Meteor",
    "universe": "Vault Comics",
    "description": "Théories et origines",
    "createdBy": { "id": "<user-uuid>", "username": "NovaFan" },
    "messageCount": 0,
    "lastMessage": null,
    "onlineCount": 0
  }
}
```

### Erreurs

Format identique à l'auth-service :

```json
{ "error": { "code": "ROOM_NOT_FOUND", "message": "Room not found." } }
```

Codes utilisés : `MISSING_TOKEN`, `TOKEN_EXPIRED`, `INVALID_TOKEN`,
`VALIDATION_ERROR`, `ROOM_NOT_FOUND`, `ROOM_EXISTS`, `NOT_FOUND`,
`INTERNAL_ERROR`.

## Socket.IO

### Handshake

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3002", {
  auth: { token: accessToken },
});
```

Le token peut aussi être envoyé via `Authorization: Bearer <token>`.
En cas d'échec, le client reçoit `connect_error` avec
`err.data.code` = `MISSING_TOKEN`, `TOKEN_EXPIRED` ou `INVALID_TOKEN`.

### Événements client → serveur

| Événement | Payload | Ack |
|---|---|---|
| `room:join` | `{ roomId }` | `{ ok, room, users }` |
| `room:leave` | `{ roomId }` | `{ ok }` |
| `message:send` | `{ roomId, text }` | `{ ok, message }` |
| `typing:start` | `{ roomId }` | — |
| `typing:stop` | `{ roomId }` | — |

Tous les acks suivent le format `{ ok: true, ... }` ou
`{ ok: false, error: { code, message } }`.

`message:send` exige d'avoir rejoint la room (`NOT_JOINED` sinon) et applique
la limite de 10 messages / 10 s (`RATE_LIMITED`).

### Événements serveur → client

| Événement | Payload |
|---|---|
| `message:new` | `{ message }` |
| `presence:update` | `{ roomId, users: [{ id, username }], count }` |
| `typing:update` | `{ roomId, user: { id, username }, isTyping }` |
| `room:created` | `{ room }` (diffusé à tous les clients connectés) |

### Exemple

```js
socket.emit("room:join", { roomId: "captain-meteor" }, (res) => {
  if (!res.ok) return console.error(res.error);
  console.log("connectés :", res.users);
});

socket.on("message:new", ({ message }) => {
  console.log(message.author, ":", message.text);
});

socket.emit("message:send", { roomId: "captain-meteor", text: "Salut !" }, (res) => {
  if (!res.ok) console.error(res.error);
});
```

## Modèles MongoDB

### Room

```js
{
  _id: "captain-meteor",      // slug, utilisé comme id public
  name: "Captain Meteor",
  universe: "Vault Comics",
  description: "...",
  createdBy: { id: "<user-uuid>", username: "NovaFan" },
  createdAt: Date,
  updatedAt: Date
}
```

### Message

```js
{
  _id: ObjectId,
  roomId: "captain-meteor",
  authorId: "<user-uuid>",
  author: "NovaFan",
  text: "...",
  createdAt: Date
}
```

Index : `{ roomId: 1, createdAt: -1, _id: -1 }`.

## Frontend

- `src/api/chatApi.js` : appels REST + `createChatSocket(token)`.
- `src/components/ChatRooms.jsx` : connexion Socket.IO, join/leave, historique,
  présence, typing, création de room.
- Sans token, la section Chat affiche un écran « Connecte-toi pour discuter ».

## Scénario de démonstration

1. Démarrer `auth-service` puis `chat-service` (`docker compose up`).
2. Se connecter avec deux comptes dans deux navigateurs.
3. Ouvrir **Chat** dans les deux, créer ou choisir une room.
4. Vérifier :
   - la liste des connectés se met à jour en temps réel ;
   - les messages arrivent instantanément ;
   - « X écrit… » apparaît pendant la saisie ;
   - l'historique est rechargé après un rafraîchissement ;
   - une room créée apparaît chez l'autre client ;
   - `docker compose down` puis `up` conserve les messages.

## Limites connues

- L'access token expire après 15 minutes. Socket.IO vérifie le token au
  handshake uniquement : après expiration, une reconnexion nécessite un
  nouveau token (se reconnecter via l'auth-service).
- La présence est stockée en mémoire : elle suppose une seule instance du
  service (pas de Redis adapter pour un déploiement multi-instances).
- Les lectures REST sont protégées : un utilisateur non connecté voit l'écran
  de connexion, pas la liste des rooms.

## Dépannage

| Problème | Piste |
|---|---|
| `ENOENT ... public.pem` | Lancer depuis `chat-service/` ou ajuster `JWT_PUBLIC_KEY_PATH` |
| `401 MISSING_TOKEN` | Ajouter `Authorization: Bearer <token>` |
| `401 INVALID_TOKEN` | Token d'un autre émetteur/audience ou clé publique différente |
| `connect_error` | Vérifier `CORS_ORIGIN` et que le service écoute sur 3002 |
| `db: "degraded"` | MongoDB n'est pas joignable (`MONGO_URI`) |
| Room absente | `POST /api/rooms` exige un token valide |
