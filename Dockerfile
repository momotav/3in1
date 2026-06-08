# Backend gateway. Build the web app separately and serve it from any static host/CDN,
# or add a static-serving step here if you want a single container.
FROM node:22-alpine
WORKDIR /app

COPY package.json ./
COPY server/package.json ./server/
RUN npm install --omit=dev --workspace @omnichat/server

COPY server ./server
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server/src/index.js"]
