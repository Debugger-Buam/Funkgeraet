FROM alpine AS buildStage
WORKDIR /build/client

# Packages
RUN apk add npm

ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools

RUN apk update
RUN apk add build-base gcc wget make git

# Dependencies
COPY client/package.json /build/client/package.json
COPY client/package-lock.json /build/client/package-lock.json
RUN npm ci

# Build
COPY client/src /build/client/src
COPY shared /build/shared
COPY client/tsconfig.json /build/client/tsconfig.json
COPY client/webpack.config.js /build/client/webpack.config.js
RUN npm run docker-build

# Release
FROM nginx:alpine
WORKDIR /home/app
RUN apk add bash
## Setup  Environment
COPY client/scripts/env.sh env.sh
RUN chmod +x env.sh
RUN echo $'WEB_SOCKET_SERVER_URL=\n\
STUN_SERVER_URL='>> .env

## Setup nginx config
COPY client/nginx.conf /etc/nginx/nginx.conf

## Supply built files
RUN rm -rf /usr/share/nginx/html
COPY client/static /usr/share/nginx/html
COPY --from=buildStage /build/client/dist/js /usr/share/nginx/html
CMD ["/bin/bash", "-c", "./env.sh && cp static/env-config.js /usr/share/nginx/html/env-config.js && nginx -g \"daemon off;\""]
