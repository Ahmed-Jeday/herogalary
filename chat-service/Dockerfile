FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./
# package-lock.json est généré au premier `npm install` local.
# On utilise `npm ci` dès qu'il existe pour des builds reproductibles.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi


FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    PORT=3002

WORKDIR /app

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

# La clé publique JWT est montée au runtime (voir docker-compose.yml) :
#   ../auth-service/keys/public.pem -> /app/keys/public.pem

USER node

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3002) + '/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
