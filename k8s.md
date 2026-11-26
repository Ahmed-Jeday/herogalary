# Rapport d'analyse Kubernetes

## Portee de la revue

Cette version reprend une analyse statique du dossier `k8s/`, des Dockerfiles applicatifs, des routes HTTP exposes par les trois API, du frontend et de sa configuration Nginx.

Les 23 documents YAML du dossier ont ete parses avec un parseur YAML. Tous les fichiers sont syntaxiquement valides. Une validation Kubernetes avec `kubectl`, ainsi qu'un deploiement reel, n'ont pas pu etre effectues dans l'environnement actuel : `kubectl`, Docker, Minikube et Kind sont absents.

## Etat actuel

Le dossier peut servir de base locale de demonstration. Les corrections suivantes sont deja presentes dans les fichiers actuels :

- les images auth, chat, shop et frontend ont des ressources Kubernetes distinctes ;
- auth utilise un Secret pour ses chemins de cle privee et publique ;
- la migration Prisma est separee du Deployment auth dans `k8s/auth/migrate-job.yaml` ;
- le frontend, les API et les bases ont des sondes de demarrage, readiness ou liveness ;
- PostgreSQL et les deux MongoDB utilisent des PVC ;
- les ressources applicatives sont regroupes dans le namespace `heroverse`.

Le projet n'est cependant pas pret pour un environnement partage ou de production.

## Constats prioritaires

| Priorite | Sujet | Constat verifie | Action |
|---|---|---|---|
| Bloquante | Secrets d'exemple | `k8s/secrets.example.yaml` contient des valeurs a remplacer. Le namespace ne contient pas automatiquement le Secret `jwt-keys` ni le Secret `db-secret`. | Ne pas appliquer le modele tel quel. Creer les Secrets reels avec `kubectl` ou un gestionnaire de secrets, puis appliquer uniquement les manifestes de configuration. |
| Bloquante | PostgreSQL et DATABASE_URL | PostgreSQL utilise `POSTGRES_PASSWORD` depuis `db-secret`. Auth utilise `DATABASE_URL` depuis le meme Secret. Les deux valeurs doivent correspondre au meme mot de passe et a la meme base `heroverse_auth`. | Creer `db-secret` avant PostgreSQL, auth et le Job de migration. Encoder les caracteres reserves du mot de passe dans l'URI PostgreSQL. |
| Bloquante | Clés JWT | Le Secret `jwt-keys` est monte dans `/keys` par auth, chat et shop. Une cle publique est necessaire aux trois API ; seule auth necessite la cle privee. Le Dockerfile auth ne copie plus `keys/` dans ses couches. | Conserver une paire existante si des jetons ont deja ete emis. Ne jamais committer les PEM ni les integrer aux images. |
| Bloquante | URL du frontend | Les variables Vite sont injectees au build, pas au demarrage du container. Les valeurs par defaut du Dockerfile racine sont `localhost:3001`, `3002` et `3003`, donc l'adresse locale du navigateur de l'utilisateur est utilisee. | Construire l'image avec des URL publiques ou avec l'origine `http://heroverse.local`, puis recompiler l'image apres tout changement de domaine. |
| Haute | Images locales | Tous les Deployments applicatifs utilisent `imagePullPolicy: Never` et les tags `heroverse/*:1.0`. La migration utilise egalement ces tags locaux. | Pour Minikube ou Kind, construire puis charger les quatre images locales. Pour un registre, pousser les images, utiliser des tags immuables et remplacer `Never` par `IfNotPresent` ou `Always`. |
| Haute | Auth MongoDB | Chat et shop configurent des URI sans identifiants vers `chat-mongo` et `shop-mongo`. Les deux bases MongoDB demarrent sans authentification. | Pour tout environnement partage, activer l'initiation MongoDB avec utilisateur/mot de passe, stocker les URI authentifiees dans un Secret et redemarrer les deux services. |
| Haute | Ingress HTTP | `k8s/ingress.yaml` expose uniquement `heroverse.local` en HTTP. Il ne configure ni TLS ni DNS. | Configurer un hote public, un DNS stable, TLS/cert-manager si necessaire et une `CORS_ORIGIN` correspondant exactement a l'origine publique. |
| Haute | Disponibilite des bases | PostgreSQL, chat-mongo et shop-mongo ont un seul replica. Chaque PVC est en `ReadWriteOnce` et utilise la StorageClass par défaut. `Recreate` evite les montages simultanes mais n'assure aucune haute disponibilite. | Valider la StorageClass, les capacites et les strategies de sauvegarde. Prevoir une base externe geree ou un cluster opere pour la production. |
| Moyenne | Journalisation et ressources | Les bases disposent de probes mais pas de sauvegarde ni de gestion des donnees testee. MongoDB n'avait pas de stratégie de persistance supplementaire en dehors du PVC. | Ajouter supervision, sauvegardes/restaurations testees, retention des logs, quotas par namespace et alertes. |
| Moyenne | Liveness du service auth | La livenessProbe auth est TCP au niveau du processus. La readinessProbe `/health` repond OK sans verifier PostgreSQL. | Conserver cette separation pour la disponibilite locale, puis ajouter dans l'application une readiness distincte qui controle Prisma/PostgreSQL. |
| Moyenne | Liveness du service shop | Shop utilise une readiness `/health` sans verification MongoDB et une liveness TCP independante. | Ajouter une readiness basee sur la connexion MongoDB, tout en conservant une liveness qui ne depend pas de MongoDB. |
| Moyenne | Chat Socket.IO | Chat expose `/socket.io` via l'Ingress avec des timeouts de 3600 secondes. Les probes chat utilisent TCP pour la liveness et `/health` pour la readiness. | Valider WebSocket et les headers Nginx sur le controleur Ingress cible. Ajouter les annotations necessaires si le controleur utilise un comportement restrictif par defaut. |

## Points verifies dans le code applicatif

- Auth expose `/health`, `/api/auth` et `/api/dashboard`.
- Chat expose `/health`, `/api/rooms` et `/socket.io`.
- Shop expose `/health` et `/api/orders`.
- Les chemins de l'Ingress correspondent aux routes backend :
  - `/api/auth` vers auth ;
  - `/api/dashboard` vers auth ;
  - `/api/rooms` vers chat ;
  - `/socket.io` vers chat ;
  - `/api/orders` vers shop ;
  - `/` vers frontend.
- La CORS de chaque API doit accepter exactement l'origine du navigateur.
- Les Deployments chat et shop utilisent des URI MongoDB distinctes : `heroverse_chat` et `heroverse_shop`.

## Deploiement local recommande

### 1. Creer le namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Creer les Secrets

Generer une paire RSA si aucune paire existante ne doit etre conservée :

```bash
cd auth-service
npm ci
npm run generate:keys
cd ..

kubectl create secret generic jwt-keys \
  --namespace heroverse \
  --from-file=private.pem=auth-service/keys/private.pem \
  --from-file=public.pem=auth-service/keys/public.pem
```

Créer ensuite `db-secret` depuis des valeurs reelles :

```bash
kubectl create secret generic db-secret \
  --namespace heroverse \
  --from-literal=POSTGRES_PASSWORD='<mot-de-passe-reel>' \
  --from-literal=DATABASE_URL='postgresql://postgres:<mot-de-passe-encode>@postgres:5432/heroverse_auth?schema=public'
```

Ne pas appliquer `k8s/secrets.example.yaml` avec ses valeurs d'exemple.

### 3. Construire et charger les images locales

```bash
docker build -t heroverse/auth:1.0 ./auth-service
docker build -t heroverse/chat:1.0 ./chat-service
docker build -t heroverse/shop:1.0 ./shop-service
docker build \
  --build-arg VITE_AUTH_API_URL=http://heroverse.local \
  --build-arg VITE_CHAT_API_URL=http://heroverse.local \
  --build-arg VITE_SHOP_API_URL=http://heroverse.local \
  -t heroverse/frontend:1.0 \
  -f Dockerfile .
```

Pour Minikube :

```bash
minikube image load heroverse/auth:1.0
minikube image load heroverse/chat:1.0
minikube image load heroverse/shop:1.0
minikube image load heroverse/frontend:1.0
```

Pour Kind :

```bash
kind load docker-image \
  heroverse/auth:1.0 \
  heroverse/chat:1.0 \
  heroverse/shop:1.0 \
  heroverse/frontend:1.0
```

### 4. Appliquer les manifestes dans l'ordre

```bash
kubectl apply -f k8s/configmap.yaml

kubectl apply -f k8s/databases/postgres-pvc.yaml
kubectl apply -f k8s/databases/postgres-deployment.yaml
kubectl apply -f k8s/databases/postgres-service.yaml

kubectl apply -f k8s/databases/chat-mongo-pvc.yaml
kubectl apply -f k8s/databases/chat-mongo-deployment.yaml
kubectl apply -f k8s/databases/chat-mongo-service.yaml

kubectl apply -f k8s/databases/shop-mongo-pvc.yaml
kubectl apply -f k8s/databases/shop-mongo-deployment.yaml
kubectl apply -f k8s/databases/shop-mongo-service.yaml

kubectl -n heroverse rollout status deployment/postgres --timeout=180s
kubectl -n heroverse rollout status deployment/chat-mongo --timeout=180s
kubectl -n heroverse rollout status deployment/shop-mongo --timeout=180s
```

Executer les migrations et attendre leur resultat avant de deployer auth :

```bash
kubectl delete job auth-migrate -n heroverse --ignore-not-found
kubectl apply -f k8s/auth/migrate-job.yaml
kubectl -n heroverse wait --for=condition=complete job/auth-migrate --timeout=180s
```

Puis appliquer les applications :

```bash
kubectl apply -f k8s/auth/deployment.yaml
kubectl apply -f k8s/auth/service.yaml
kubectl apply -f k8s/chat/deployment.yaml
kubectl apply -f k8s/chat/service.yaml
kubectl apply -f k8s/shop/deployment.yaml
kubectl apply -f k8s/shop/service.yaml
kubectl apply -f k8s/frontend/deployment.yaml
kubectl apply -f k8s/frontend/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 5. Verifier

```bash
kubectl get pods,services,ingress,pvc -n heroverse
kubectl get events -n heroverse --sort-by=.lastTimestamp
kubectl logs -n heroverse job/auth-migrate
kubectl logs -n heroverse deployment/auth
kubectl logs -n heroverse deployment/chat
kubectl logs -n heroverse deployment/shop
```

Faire pointer `heroverse.local` vers l'adresse IP du controleur Ingress, puis ouvrir `http://heroverse.local`. Pour un test temporaire sans Ingress :

```bash
kubectl port-forward -n heroverse service/frontend 8080:80
```

Dans ce cas, le frontend doit avoir ete construit avec `http://localhost:8080` ou une URL equivalentement accessible depuis le navigateur.

## Critères avant production

1. Supprimer toute cle privee des images et proteger les Secrets Kubernetes.
2. Activer l'authentification PostgreSQL et MongoDB avec des secrets distincts.
3. Configurer TLS, DNS, CORS et une origine publique stable.
4. Utiliser un registre d'images, des tags immuables et une strategie `IfNotPresent` ou `Always`.
5. Choisir une StorageClass adaptée, dimensionner les volumes et tester les sauvegardes/restaurations.
6. Ajouter readiness/liveness propres aux dependances PostgreSQL et MongoDB.
7. Tester le deploiement complet sur un cluster compatible avant toute donnée réelle.
