FROM node:24.13.0 AS build

WORKDIR /app
COPY --chown=node:node . /app
RUN apt-get update -y && \
  apt-get install build-essential libvips-dev -y && \
  npm i --verbose --production && \
  chown -R node:node /app && \
  apt-get clean autoclean && \
  apt-get autoremove --yes && \
  rm -rf /var/lib/apt/lists/*

USER node
CMD ["node", "app.js"]
