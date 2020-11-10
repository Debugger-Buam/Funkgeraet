# Ganz Egal Issas Net
![Frontend CI](https://github.com/Debugger-Buam/ganzegalissasnet/workflows/Frontend%20CI/badge.svg)

![Backend CI](https://github.com/Debugger-Buam/ganzegalissasnet/workflows/Backend%20CI/badge.svg)

## HTTPS Development
### Setup
#### Network
- (optional) assign a fixed IP to your machines MAC via your routers DHCP
- In client/.env change `WEB_SOCKET_SERVER_URL` to use the IP of your development machine in your local network e.g. 10.0.0.2

#### Development Machine
- Install [mkcert](https://github.com/FiloSottile/mkcert)
- Install local CA root `mkcert -install`
- Create certificates for the domains and IPs with which you want to access the app, e.g. `mkcert localhost 10.0.0.2`
- Move those generated certificates into `./cert` and name them `local.pem` and `local-key.pem`

#### Android
- Move rootCA.pem onto phone (file location is in `mkcert -CAROOT`)
- Security > Encryption & credentials > Install from storage

### Development
- Client: `npm run start-secure`
- Server: `npm run start-secure`
