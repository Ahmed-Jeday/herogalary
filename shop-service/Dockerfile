FROM node:22-bullseye AS dependencies

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

FROM node:22-bullseye AS runtime

ENV NODE_ENV=production \
    PORT=3003

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER node

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3003) + '/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
