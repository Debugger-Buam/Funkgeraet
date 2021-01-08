# Funkgerät
![Frontend CI](https://github.com/Debugger-Buam/Funkgeraet/workflows/Frontend%20CI/badge.svg) 
![Backend CI](https://github.com/Debugger-Buam/Funkgeraet/workflows/Backend%20CI/badge.svg) 
![Publish Frontend Image](https://github.com/Debugger-Buam/Funkgeraet/workflows/Publish%20Frontend%20Image/badge.svg) 
![Publish Backend Image](https://github.com/Debugger-Buam/Funkgeraet/workflows/Publish%20Backend%20Image/badge.svg) 
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=Debugger-Buam_Funkgeraet&metric=bugs)](https://sonarcloud.io/dashboard?id=Debugger-Buam_Funkgeraet)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=Debugger-Buam_Funkgeraet&metric=code_smells)](https://sonarcloud.io/dashboard?id=Debugger-Buam_Funkgeraet)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=Debugger-Buam_Funkgeraet&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=Debugger-Buam_Funkgeraet)
[![Duplicated Lines Density](https://sonarcloud.io/api/project_badges/measure?project=Debugger-Buam_Funkgeraet&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=Debugger-Buam_Funkgeraet)

## Docker
As both client and server use code in `shared/`, the docker build context must be in root, otherwise it can't be used. 
Therefore `docker-compose` needs to be used, that can supply a different build context.

### Build
- In root, call `docker-compose -f docker-compose-build.yml build server` and `docker-compose -f docker-compose-build.yml build client`

### Start individually
- Client: `docker run -e WEB_SOCKET_SERVER_URL=localhost:6503 -e STUN_SERVER_URL=turn:localhost -d -p 8080:80 funkgeraet_client`
- Server: `docker run --rm -d -p 6503:6503 funkgeraet_server`

### Use published images with docker compose
- Use template `docker-compose.yml` and adapt environment variables
- In same folder as the compose file, call `docker-compose up`

## HTTPS Development
### Setup
#### Network
- (optional) assign a fixed IP to your machines MAC via your routers DHCP
- In client/.env change `WEB_SOCKET_SERVER_URL` to use the IP of your development machine in your local network e.g. 10.0.0.2

#### Development Machine
- Install [mkcert](https://github.com/FiloSottile/mkcert)
- Install local CA root `mkcert -install`
- Create certificates for the domains and IPs with which you want to access the app, e.g. `mkcert localhost 10.0.0.2`
- Move those generated certificates into `./certs` and name them `local.pem` and `local-key.pem`

#### Android
- Move rootCA.pem onto phone (file location is in `mkcert -CAROOT`)
- Security > Encryption & credentials > Install from storage
- Tested with Chrome (FF doesn't use root CA for some reason)

### Development
- Client: `npm run start-secure`
- Server: `npm run start-secure`
