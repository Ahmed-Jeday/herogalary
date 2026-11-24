FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_AUTH_API_URL=http://localhost:3001
ARG VITE_CHAT_API_URL=http://localhost:3002
ARG VITE_SHOP_API_URL=http://localhost:3003
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL \
    VITE_CHAT_API_URL=$VITE_CHAT_API_URL \
    VITE_SHOP_API_URL=$VITE_SHOP_API_URL

RUN npm run build

FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
