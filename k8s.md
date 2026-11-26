# Rapport d’analyse Kubernetes

## Résumé

Le dossier `k8s/` contient les ressources principales pour exécuter le frontend, les trois API et les bases de données. Il constitue une bonne base de développement, mais **n’est pas prêt à être appliqué tel quel** : les secrets sont des exemples, la construction du frontend doit recevoir les URL Kubernetes, et les images sont configurées pour un usage local uniquement.

Les manifestes n’ont pas pu être vérifiés avec `kubectl` dans l’environnement d’analyse : `kubectl`, Docker, Minikube et Kind n’y sont pas installés. Les observations ci-dessous sont une revue statique des manifestes et des configurations applicatives.

## Défauts et corrections recommandées

| Priorité | Sujet | Constat et impact | Correction |
|---|---|---|---|
| Bloquant | Secrets et clés JWT | [`k8s/secrets.example.yaml`](./k8s/secrets.example.yaml) contient des valeurs d’exemple et ne doit pas servir de configuration réelle. Les pods auth, chat et shop ont besoin des secrets `db-secret` et `jwt-keys`. Sans vraies clés correspondantes, auth ne peut pas signer les JWT et chat/shop ne peuvent pas les vérifier. | Créer un vrai `db-secret` avec le mot de passe PostgreSQL et une URL `DATABASE_URL` cohérente, puis un `jwt-keys` depuis les deux fichiers PEM générés. Ne jamais committer les valeurs réelles. |
| Élevé | Clé privée intégrée à l’image auth | [`auth-service/Dockerfile`](./auth-service/Dockerfile) copiait `keys/` dans les étapes build et runtime : si une paire réelle existait au moment du build, la clé privée se retrouvait dans les couches de l’image. **Corrigé** : les deux instructions `COPY` ont été supprimées, et la configuration Compose locale monte désormais `auth-service/keys` en lecture seule. | La clé est fournie uniquement au runtime (volume Secret Kubernetes, bind mount Compose local). Ne jamais réintroduire `COPY keys/` dans le Dockerfile ni committer les PEM. |
| Bloquant | URL API du frontend | Le Dockerfile racine utilise par défaut `http://localhost:3001`, `:3002` et `:3003`. Les variables Vite sont intégrées à la compilation et ne sont pas modifiées par le Deployment. Depuis le navigateur d’un utilisateur, `localhost` désigne son propre poste : les appels API et le socket échouent. | Construire `heroverse/frontend:1.0` en passant les trois `VITE_*_API_URL` avec l’hôte Ingress, par exemple `http://heroverse.local`. Utiliser `https://` si TLS est activé. |
| Élevé | Images `imagePullPolicy: Never` | Les Deployments auth, chat, shop et frontend exigent que l’image existe déjà sur chaque nœud. Ils ne fonctionneront pas avec des images uniquement présentes dans un registre distant. | Pour un cluster local, construire puis charger les images sur le cluster (commandes ci-dessous). Pour un cluster distant, pousser les images dans un registre, utiliser un tag versionné et remplacer `Never` par `IfNotPresent` ou `Always`. |
| Élevé | Migrations PostgreSQL | `prisma migrate deploy` était exécuté comme init container de chaque pod auth, sans garantie que PostgreSQL soit prêt et en couplant la migration au cycle de vie des réplicas. **Corrigé** : un Job dédié [`k8s/auth/migrate-job.yaml`](./k8s/auth/migrate-job.yaml) attend la disponibilité de PostgreSQL puis applique les migrations. | Appliquer et attendre la réussite du Job avant de déployer auth (voir « Déployer dans l’ordre »). Pour un usage réel, conserver cette séparation et surveiller l’échec du Job. |
| Élevé | Santé des services | Les probes auth/shop ciblent `/health`, qui renvoie actuellement OK sans contrôler la base. À l’inverse, la santé chat dépend de MongoDB et sert à la fois de readiness et de liveness : une panne Mongo peut provoquer des redémarrages inutiles. | Séparer les sondes : liveness vérifie que le processus répond ; readiness vérifie aussi la disponibilité des dépendances nécessaires. Ajouter `startupProbe` si le démarrage ou les migrations peuvent prendre du temps. |
| Élevé | MongoDB sans authentification | [`k8s/databases/chat-mongo-deployment.yaml`](./k8s/databases/chat-mongo-deployment.yaml) et [`k8s/databases/shop-mongo-deployment.yaml`](./k8s/databases/shop-mongo-deployment.yaml) lancent MongoDB sans utilisateur ni mot de passe. Chat et shop y accèdent sur le réseau du cluster sans authentification. Cela convient uniquement à un environnement local/de démonstration isolé. | Pour un environnement partagé ou de production, activer l’authentification MongoDB, stocker les identifiants dans un Secret, puis fournir des URI authentifiées aux Deployments chat et shop. |
| Moyen | Stockage persistant dépendant du cluster | Les PVC PostgreSQL et MongoDB demandent chacun 1 Gio sans `storageClassName`. Le provisionnement dépend de la StorageClass par défaut du cluster ; sans provisionneur compatible, les pods de base restent bloqués en `Pending`. Aucun mécanisme de sauvegarde n’est défini. | Vérifier les StorageClasses avant déploiement, augmenter les tailles selon les besoins et mettre en place des sauvegardes/restaurations testées. Un PVC n’est pas une sauvegarde. |
| Moyen | Bases de données à instance unique | PostgreSQL et MongoDB n’ont qu’un seul replica. Une panne ou une mise à jour de leur pod interrompt le service ; `Recreate` et les PVC `ReadWriteOnce` ne fournissent pas de haute disponibilité. | Pour un usage réel, externaliser les bases vers des services managés ou adopter une architecture StatefulSet/cluster opérée et supervisée. |
| Moyen | TLS Ingress absent | [`k8s/ingress.yaml`](./k8s/ingress.yaml) ne déclare ni TLS ni certificat : le trafic est en HTTP et l’hôte est `heroverse.local`. | Pour un accès autre que local, configurer DNS, TLS (par exemple cert-manager), l’hôte réel et l’origine CORS correspondante. |
| Moyen | Configuration runtime limitée | Les Deployments applicatifs définissent peu de paramètres opérationnels ; MongoDB n’a ni limites CPU/mémoire ni liveness probe. Les limites configurées pour les API et le frontend sont de bons débuts, mais ne remplacent pas la supervision. | Définir requests/limits adaptés pour les bases, des probes adaptées, des règles de journalisation et des alertes. Vérifier les besoins réels avant de fixer les quotas en production. |

### Détails de configuration

- L’Ingress utilise des noms de Services et ports présents dans les manifestes. Il route les chemins API sans réécriture, ce qui correspond aux routes `/api/...` des applications. Les timeouts longs sont cohérents avec Socket.IO ; il faut néanmoins valider la connexion WebSocket dans le cluster cible.
- `CORS_ORIGIN` vaut `http://heroverse.local`. Cette valeur doit être exactement l’origine utilisée par le navigateur (schéma, nom et port), et être mise à jour avec l’URL publique ou TLS.
- Les noms de bases `heroverse_chat` et `heroverse_shop` sont sélectionnés dans les URI des applications. Comme la configuration Compose locale, Kubernetes utilise deux instances MongoDB séparées (`chat-mongo` et `shop-mongo`) avec leur propre PVC, afin de ne pas partager le même domaine de panne.
- Les manifestes supposent que les images s’appellent exactement `heroverse/auth:1.0`, `heroverse/chat:1.0`, `heroverse/shop:1.0` et `heroverse/frontend:1.0`.

## Mise en route locale

Prérequis : un cluster Kubernetes fonctionnel, `kubectl`, Docker, et un contrôleur Ingress NGINX. Pour Minikube, activer l’Ingress avec `minikube addons enable ingress`. Pour Kind, installer un contrôleur Ingress adapté au cluster.

### 1. Créer les secrets

Si une paire de clés JWT valide existe déjà et est utilisée par l’application, la conserver : ne pas la régénérer, sinon les JWT existants ne seront plus vérifiables. Sinon, générer une paire RSA puis créer le Secret Kubernetes à partir des fichiers, sans inclure les clés dans une image :

```bash
cd auth-service
npm ci
npm run generate:keys
cd ..

kubectl apply -f k8s/namespace.yaml
kubectl create secret generic jwt-keys \
  --namespace heroverse \
  --from-file=private.pem=auth-service/keys/private.pem \
  --from-file=public.pem=auth-service/keys/public.pem \
  --dry-run=client -o yaml | kubectl apply -f -
```

Créer `db-secret` à partir du modèle, après avoir remplacé ses valeurs par des valeurs réelles. Comme `jwt-keys` a déjà été créé avec les fichiers PEM, supprimer du fichier local le second document YAML `jwt-keys` avant d’appliquer le modèle :

```bash
cp k8s/secrets.example.yaml k8s/secrets.yaml
chmod 600 k8s/secrets.yaml
# Éditer k8s/secrets.yaml : mot de passe réel et DATABASE_URL cohérente.
# Format attendu : postgresql://postgres:<mot-de-passe>@postgres:5432/heroverse_auth?schema=public
kubectl apply -f k8s/secrets.yaml
```

Le mot de passe dans `DATABASE_URL` doit être le même que `POSTGRES_PASSWORD`. S’il contient des caractères réservés aux URL, il doit être encodé dans l’URL. Le fichier `k8s/secrets.yaml` est ignoré par Git ; le laisser hors du dépôt et ne pas le publier dans un artefact.

### 2. Construire les images

Avant de construire auth, appliquer la correction au Dockerfile pour ne pas intégrer la clé privée dans l’image. Pour un cluster local avec les images préchargées :

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

Charger les quatre images dans le cluster local utilisé :

```bash
# Choisir la commande correspondant au cluster :
minikube image load heroverse/auth:1.0
minikube image load heroverse/chat:1.0
minikube image load heroverse/shop:1.0
minikube image load heroverse/frontend:1.0

# Pour Kind, remplacer les quatre commandes précédentes par :
# kind load docker-image heroverse/auth:1.0 heroverse/chat:1.0 \
#   heroverse/shop:1.0 heroverse/frontend:1.0
```

### 3. Déployer dans l’ordre

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/databases/postgres-pvc.yaml -f k8s/databases/postgres-deployment.yaml -f k8s/databases/postgres-service.yaml
kubectl apply -f k8s/databases/chat-mongo-pvc.yaml -f k8s/databases/chat-mongo-deployment.yaml -f k8s/databases/chat-mongo-service.yaml
kubectl apply -f k8s/databases/shop-mongo-pvc.yaml -f k8s/databases/shop-mongo-deployment.yaml -f k8s/databases/shop-mongo-service.yaml

kubectl -n heroverse rollout status deployment/postgres --timeout=180s
kubectl -n heroverse rollout status deployment/chat-mongo --timeout=180s
kubectl -n heroverse rollout status deployment/shop-mongo --timeout=180s

# Exécuter et valider les migrations avant le déploiement auth
kubectl delete job auth-migrate -n heroverse --ignore-not-found
kubectl apply -f k8s/auth/migrate-job.yaml
kubectl -n heroverse wait --for=condition=complete job/auth-migrate --timeout=180s

kubectl apply -f k8s/auth/deployment.yaml
kubectl -n heroverse rollout status deployment/auth --timeout=180s
kubectl apply -f k8s/auth/service.yaml

kubectl apply -f k8s/chat/deployment.yaml -f k8s/chat/service.yaml
kubectl apply -f k8s/shop/deployment.yaml -f k8s/shop/service.yaml
kubectl apply -f k8s/frontend/deployment.yaml -f k8s/frontend/service.yaml
kubectl apply -f k8s/ingress.yaml
```

Les migrations sont désormais exécutées par un Job dédié (`k8s/auth/migrate-job.yaml`) qui attend PostgreSQL, et non plus par un init container du Deployment auth.

### 4. Vérifier l’état et accéder à l’application

```bash
kubectl get pods,svc,ingress,pvc -n heroverse
kubectl get events -n heroverse --sort-by=.lastTimestamp
kubectl logs -n heroverse deployment/auth
kubectl logs -n heroverse deployment/chat
kubectl logs -n heroverse deployment/shop
```

Faire pointer `heroverse.local` vers l’adresse IP Ingress du cluster (par exemple dans le fichier `hosts` local), puis ouvrir `http://heroverse.local`. Avec Minikube, l’adresse est consultable avec `minikube ip`. Si aucun Ingress n’est installé, tester temporairement un Service avec `kubectl port-forward -n heroverse svc/frontend 8080:80`, puis ouvrir `http://localhost:8080` ; les URL API intégrées au frontend doivent alors aussi être adaptées à cette topologie.

Si un pod ne démarre pas, consulter `kubectl describe pod -n heroverse <nom-du-pod>` et les logs du Job de migration avec `kubectl logs -n heroverse job/auth-migrate`.

## Critères avant usage de production

1. Retirer les clés JWT du Dockerfile et vérifier qu’aucune clé privée n’est publiée dans les images.
2. Remplacer les secrets d’exemple, protéger leur stockage et définir une procédure de rotation.
3. Utiliser un registre d’images, des tags immuables et une politique de récupération compatible.
4. Construire le frontend avec le domaine final, configurer TLS et harmoniser CORS.
5. Activer l’authentification MongoDB ; définir sauvegardes, restauration et supervision des bases.
6. Séparer readiness/liveness, exécuter les migrations comme tâche dédiée et valider PVC/StorageClass.
7. Tester le déploiement complet sur un cluster représentatif avant d’y placer des données réelles.
