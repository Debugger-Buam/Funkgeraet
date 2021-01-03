FROM alpine AS buildStage
WORKDIR /build/server

# Packages
RUN apk add npm

ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools

RUN apk update
RUN apk add build-dependencies build-base gcc wget make git

# Dependencies
COPY server/package.json /build/server/package.json
COPY server/package-lock.json /build/server/package-lock.json
RUN npm ci

# Build
COPY server/src /build/server/src
COPY shared /build/shared
COPY server/tsconfig.json /build/server/tsconfig.json
RUN npm run build

# Release
FROM node:alpine
WORKDIR /home/app
COPY --from=buildStage /build/server/dist /home/app/dist
COPY --from=buildStage /build/server/node_modules /home/app/node_modules
EXPOSE 6503
CMD [ "node", "./dist/server/src/server.js" ]
