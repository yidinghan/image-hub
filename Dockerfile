# 构建阶段
FROM node:24.13.0-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache build-base vips-dev python3 && \
    npm i --production

# 运行阶段
FROM node:24.13.0-alpine
WORKDIR /app
RUN apk add --no-cache vips && \
    addgroup -g 1000 node || true && \
    adduser -u 1000 -G node -s /bin/sh -D node || true
COPY --from=build /app/node_modules ./node_modules
COPY --chown=node:node . .
USER node
CMD ["node", "app.js"]
