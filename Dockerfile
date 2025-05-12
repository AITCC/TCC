FROM node:20-slim AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]



FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN npm run build



FROM node:20-slim AS production
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
RUN npm install --omit=dev
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]