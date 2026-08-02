FROM node:20-alpine AS build
WORKDIR /app
COPY apps/web/package.json ./package.json
RUN npm install
COPY apps/web/tsconfig.json apps/web/vite.config.ts ./
COPY apps/web/src ./src
RUN npm run build
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY Дизайн-система/app-icon.png /usr/share/nginx/html/app-icon.png
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
