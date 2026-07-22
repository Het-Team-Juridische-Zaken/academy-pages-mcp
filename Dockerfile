# Container voor de webversie (Azure Container Apps / App Service).
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/http-server.mjs"]
