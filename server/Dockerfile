FROM alpine AS buildStage
WORKDIR /build/server

# Packages
RUN apk add npm

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
