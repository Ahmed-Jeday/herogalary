FROM node:22-bullseye AS base

WORKDIR /app


FROM base AS dependencies

COPY package*.json ./
RUN npm ci


FROM dependencies AS build

COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src
COPY keys ./keys
RUN npx prisma generate

FROM base AS runtime

ENV NODE_ENV=production \
    PORT=3001

WORKDIR /app

# Copy node_modules from the build stage (NOT from dependencies) so the
# generated Prisma Client and the matching engines are actually shipped.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/keys ./keys
COPY --chown=node:node package.json package-lock.json ./

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
