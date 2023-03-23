FROM node:18.14.2 as build

COPY package*.json /app/
RUN cd /app && \
  apt-get update -y && \
  apt-get install build-essential libvips-dev -y && \
  npm i --verbose --production

WORKDIR /app
COPY . /app
COPY --from=build /app/node_modules /app/node_modules

CMD ["node", "app.js"]
