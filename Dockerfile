FROM node:12.12.0 as build

COPY package*.json /app/
RUN cd /app && \
  npm i --verbose

FROM node:12.12.0-alpine
COPY . /app
COPY --from=build /app/node_modules /app/node_modules

CMD ["node", "app.js"]