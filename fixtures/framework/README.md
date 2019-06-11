# <dir>

## Setup and Execution

### Dependencies

The following tools should already be installed

1. docker
2. docker-compose

### Starting STRATO

Start STRATO using the following environment variables

```
OAUTH_ENABLED=true OAUTH_CLIENT_ID=<client-id> OAUTH_CLIENT_SECRET=<client-secret> OAUTH_DISCOVERY_URL=<discovery-url> OAUTH_JWT_USERNAME_PROPERTY=email HTTP_PORT=8080 NODE_HOST=localhost:8080 ./strato.sh --single
```

### Obtaining an ADMIN TOKEN

This project requires an `ADMIN_TOKEN` env varibale for the deploy to work. This token can be obtained by using the `token-getter` utility packaged in `blockapps-rest`. This utility can be executed by running the following command:

```
yarn token-getter
```

This command launches a small web server on port 8000 and open a browser window. The user can now login with the admin credentials. Once logged in, the web server will display the token on a web page. This token can be copied in pasted into a `.env` file under the `<dir>-server` folder. Alternatively, it can be supplied as a runtime environment variable by setting the `ADMIN_TOKEN` environment variable when running `yarn start`.

### Executing for development

#### Start nginx

```
cd nginx-docker
HOST_IP=$(ipconfig getifaddr en0) docker-compose up -d
```

_NOTE:_ Your interface might be different. Replace `en0` with your network interface identifier.

Nginx acts as a proxy for the frontend and the backend. It is required so that both the frontend and the backend have the same root URL (required for authentication).

#### Deploy the app and start backend

```
cd <dir>-server
git submodule update --init --recursive
yarn deploy
yarn build
yarn start
```

#### Launch UI

```
cd <dir>-ui
yarn install
yarn develop
```

This should open a browser window which shows the current server time.

### Executing for deployment

```
docker-compose up -d
```
