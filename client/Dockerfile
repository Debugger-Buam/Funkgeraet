FROM alpine AS buildStage
WORKDIR /build/client

# Packages
RUN apk add npm

# Dependencies
COPY client/package.json /build/client/package.json
COPY client/package-lock.json /build/client/package-lock.json
RUN npm ci

# Build
COPY client/src /build/client/src
COPY shared /build/shared
COPY client/tsconfig.json /build/client/tsconfig.json
COPY client/webpack.config.js /build/client/webpack.config.js
COPY client/.env /build/client/.env
RUN npm run build

# Release
FROM nginx:alpine
COPY client/nginx.conf /etc/nginx/nginx.conf
RUN rm -rf /usr/share/nginx/html
COPY client/static /usr/share/nginx/html
COPY --from=buildStage /build/client/dist/js /usr/share/nginx/html

EXPOSE 80
