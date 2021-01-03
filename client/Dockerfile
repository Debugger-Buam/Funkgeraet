FROM alpine AS buildStage
WORKDIR /build/client

# Packages
RUN apk add npm

ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools

RUN apk update
RUN apk add --virtual build-dependencies build-base gcc wget git

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
