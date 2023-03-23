FROM node:18.14.2 as build

WORKDIR /app
COPY . /app
RUN apt-get update -y && \
  apt-get install build-essential libvips-dev -y && \
  npm i --verbose --production && \
  apt-get clean autoclean && \
  apt-get autoremove --yes && \
  rm -rf /var/lib/apt/lists/*

CMD ["node", "app.js"]
