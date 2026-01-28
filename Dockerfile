FROM node:lts AS build

WORKDIR /app
COPY --chown=node:node . /app
RUN apt-get update -y && \
  apt-get install build-essential libvips-dev -y && \
  npm i --verbose --production && \
  chown -R node:node /app && \
  apt-get clean autoclean && \
  apt-get autoremove --yes && \
  rm -rf /var/lib/apt/lists/*

# OCI Image Specification Labels
LABEL org.opencontainers.image.title="image-hub"
LABEL org.opencontainers.image.description="Image processing API service based on Sharp and nsfwjs"
LABEL org.opencontainers.image.authors="hanyiding"
LABEL org.opencontainers.image.url="https://github.com/yidinghan/image-hub"
LABEL org.opencontainers.image.source="https://github.com/yidinghan/image-hub"
LABEL org.opencontainers.image.documentation="https://github.com/yidinghan/image-hub#readme"
LABEL org.opencontainers.image.version="1.3.0"
LABEL org.opencontainers.image.vendor="hanyiding"
LABEL org.opencontainers.image.licenses="MIT"

USER node
CMD ["node", "app.js"]
