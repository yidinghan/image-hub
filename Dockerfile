FROM node:12.13.0-slim as build

COPY package*.json /app/
RUN cd /app && \
  npm i --verbose

FROM node:12.13.0-slim
WORKDIR /app
COPY . /app
COPY --from=build /app/node_modules /app/node_modules

CMD ["node", "app.js"]