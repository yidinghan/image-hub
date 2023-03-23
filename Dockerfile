ARG BUILDPLATFORM
ARG TARGETPLATFORM
FROM --platform=$BUILDPLATFORM node:18.14.2 as build

COPY package*.json /app/
ARG TARGETOS=linux
ARG TARGETARCH=amd64
ENV NPM_INSTALL_TARGET_ARCH=$TARGETARCH \
    NPM_INSTALL_TARGET_PLATFORM=$TARGETOS
RUN cd /app && \
  apt-get update -y && \
  apt-get install build-essential libvips-dev -y && \
  npm i --verbose --production

FROM --platform=$TARGETPLATFORM node:18.14.2-slim
WORKDIR /app
COPY . /app
COPY --from=build /app/node_modules /app/node_modules

CMD ["node", "app.js"]
