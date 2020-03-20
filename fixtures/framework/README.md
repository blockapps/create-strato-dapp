# <dir>

## Dependencies

The following tools should already be installed

1. docker
2. docker-compose

## Run the App locally (development or testing)

### Start nginx

```
cd nginx-docker
HOST_IP=$(ipconfig getifaddr en0) docker-compose up -d
```

_NOTE:_ Your interface might be different. Replace `en0` with your network interface identifier.

Nginx acts as a proxy for the frontend and the backend. It is required so that both the frontend and the backend have the same root URL (required for authentication).

### Obtaining an ADMIN TOKEN

This project requires an `ADMIN_TOKEN` environment variable for the app deployment to work. This token can be obtained by using the `token-getter` utility packaged in `blockapps-rest`. To execute this utility, run `sudo yarn token-getter` from the `<dir>-server` directory:

```
cd <dir>/<dir>-server
sudo yarn token-getter
```

This command launches a small web server on the same host (hostname and port) specified in the `redirectUri` field of `config/localhost.config.yaml`. This field was filled in by the app-framework utility from the configuration parameters it collected from the user.
- Copy the URL shown by the `token-getter` utility and enter it into your browser.
- Log in with your openID credentials.
- Once logged in, the web server will display the token on a web page. 
- Copy the "Access Token".
- Hit `CTRL+C` to quit the `token-getter`.
- Paste the token into the `.env` file under the `<dir>-server` folder, and label it as the environment variable `ADMIN_TOKEN`. Example:
```
ADMIN_TOKEN=eyJhbGci.....
```

### Deploy the App and start backend

Configure and build:

```
cd <dir>/<dir>-server
git submodule update --init --recursive --remote
yarn install
yarn build
```

Deploy contracts:
```
yarn deploy
```

Start:
```
yarn start
```

*NOTE: `yarn start` will start the server and use the terminal window to dump log information. To stop the server, hit `CTRL+C`*.

### Launch UI

In a new terminal window, run the following commands:

```
cd <dir>/<dir>-ui
yarn install
yarn develop
```

This should open a browser window and display a basic React webpage.

*NOTE: `yarn develop` will start the UI and use the terminal window to dump log information. To stop the UI, hit `CTRL+C`*.

Please make sure that `nginx` is up WITH CORRECT HOST_IP (see above).
Reminder: Your IP may change if you switch wifi or in other reasons.

### Stopping the App

To stop the app, hit `CTRL+C` on the server and UI windows. To stop the nginx server, run
```
docker stop nginx-docker_nginx_1
```

You will need to stop the nginx server if you want to get a new `ADMIN_TOKEN`, as the `token-getter` utility launches a web server on the same port.


## Run the App in Docker (production way)

### 1. Build docker images
```
git submodule update --init --recursive --remote
sudo docker-compose build
```

### 2a. Run the App as bootnode
1. Run locally:
    ```
    #!/bin/bash
    set -e
    
    export IS_BOOTNODE=true
    export API_DEBUG=true
    export SERVER_HOST=http://$(ipconfig getifaddr en0)
    export SERVER_IP=$(ipconfig getifaddr en0)
    export OAUTH_CLIENT_ID=<your-oauth-client-id>
    export OAUTH_CLIENT_SECRET=<your-oauth-client-secret>
    export OAUTH_OPENID_DISCOVERY_URL=<your-oauth-openid-discovery-url>
    export NODE_LABEL='Boot node'
    
    docker-compose up -d
    ```
   (For additional parameters to use in Prod, see docker-compose.yml reference below)
2. Wait for all docker containers to become healthy (`sudo docker ps`)

### 2b. Run the App as secondary node
Secondary node is the one that connects to the existing Dapp contract on the blockchain (deployed on app bootnode)

1. On bootnode - Get deploy file content:
    ```
    sudo docker exec <dir>_backend_1 cat /config/<dir>.deploy.yaml
    ```
2. On secondary node - create docker volume and add the same <dir>.deploy.yaml file using commands:
    ```
    sudo su
    docker volume create <dir>_config
    <dir>_CONFIG_VOLUME_DIR=$(docker volume inspect --format '{{ .Mountpoint }}' <dir>_config)
    nano ${<dir>_CONFIG_VOLUME_DIR}/<dir>.deploy.yaml
    # paste content and save
    exit
    ```
3. Run application:
    ```
    #!/bin/bash
    set -e
    
    export IS_BOOTNODE=false
    export API_DEBUG=true
    export SERVER_HOST=http://$(ipconfig getifaddr en0)
    export SERVER_IP=$(ipconfig getifaddr en0)
    export OAUTH_CLIENT_ID=<your-oauth-client-id>
    export OAUTH_CLIENT_SECRET=<your-oauth-client-secret>
    export OAUTH_OPENID_DISCOVERY_URL=<your-oauth-openid-discovery-url>
    export NODE_LABEL='Secondary node'
    
    docker-compose up -d
    ```
    (notice the IS_BOOTNODE and NODE_LABEL changes compared to bootnode's script from (2a))

### docker-compose.yml env vars reference
Some docker-compose vars are optional with default values and some are required for prod or specific OAuth provider setup.

```
IS_BOOTNODE                 - (default: 'false') if false - .deploy.yaml is expected in docker volume
API_DEBUG                   - (default: 'false') show additional logs of STRATO API calls in backend container log
CONFIG_DIR_PATH             - (default: '/config') directory inside of container to keep the config file. Not recommended to change unless you know what you are doing.
DEPLOY_FILE_NAME            - (default: '<dir>.deploy.yaml') filename of the targeted deploy file. Not recommended to change unless you know what you are doing.
NETWORK_CONFIG_FILE_NAME    - (default: '<dir>.network-config.yaml') filename of the targeted network-config file. Not recommended to change unless you know what you are doing.
APPLICATION_USER_NAME       - (default: 'APP_USER') the username of service user
SERVER_HOST                 - (required) protocol and host (protocol://hostname:port, e.g. https://example.com) of the application server
SERVER_IP                   - (required) IP address of the machine (preferably public one or the private that is accessible from other nodes in network)
NODE_LABEL                  - (required) String representing the node identificator (e.g. <dir>-staging-client2)
STRATO_NODE_PROTOCOL        - (default: 'http') Protocol of the STRATO node (http|https)
STRATO_NODE_HOST            - (default: 'strato_nginx_1:80') host (hostname:port) of the STRATO node. By default - call STRATO node in the linked docker network (see bottom of docker-compose.yml)
STRATO_LOCAL_IP             - (default: empty string, optional) Useful for Prod when STRATO is running on https and we have to call it by real DNS name (SSL requirement) but need to resolve it through the local network (e.g. STRATO port is closed to the world). Non-empty value will create /etc/hosts record in container to resolve hostname provided in STRATO_HOST to STRATO_LOCAL_IP. Example: `172.17.0.1` (docker0 IP of machine - see `ifconfig`). Otherwise - will resolve hostname with public DNS. 
NODE_PUBLIC_KEY             - (default: dummy hex public key) STRATO node's blockstanbul public key
OAUTH_APP_TOKEN_COOKIE_NAME - (default: '<dir>_session') Browser session cookie name for the node, e.g. <dir>-staging-tech'
OAUTH_OPENID_DISCOVERY_URL  - (required) OpenID discovery .well-known link
OAUTH_CLIENT_ID             - (required) OAuth client id (Client should have the redirect uri `/api/v1/authentication/callback` set up on OAuth provider)
OAUTH_CLIENT_SECRET         - (required) OAuth client secret
OAUTH_SCOPE                 - (default: 'openid email') - custom OAuth scope (e.g. for Azure AD v2.0 authentication: 'openid offline_access <client_secret>/.default')
OAUTH_SERVICE_OAUTH_FLOW    - (default: 'client-credential') - OAuth flow to use for programmatic token fetch (refer to blockapps-rest options)
OAUTH_TOKEN_FIELD           - (default: 'access_token') - value of the service flow response to use as access token (e.g. 'access_token'|'id_token')
OAUTH_TOKEN_USERNAME_PROPERTY               - (default: 'email') - OAuth access token's property to use as user identifier in authorization code grant flow (e.g. 'email' for Keycloak, 'upn' for Azure AD)
OAUTH_TOKEN_USERNAME_PROPERTY_SERVICE_FLOW  - (default: 'email') - OAuth access token's property to use as user identifier in oauth service (e.g. client-credential) flow (e.g. 'email for Keycloak, 'oid' for Azure AD)
SSL - (default: 'false')    - rather to run on http or https ('false'|'true') (see SSL cert letsencrypt tool section for fetching the cert)
SSL_CERT_TYPE               - (default: 'crt') SSL cert file type ('crt'|'pem')
```

### SSL cert letsencrypt tool
The tool automates the process of obtaining the real SSL certificate using certbot and letsencrypt. Certs are valid for 3 months and should be auto-updated (see (2)):
1. To get the certificate on remote machine:
    ```
    cd nginx-docker/letsencrypt
    sudo ./get-first-cert.sh
    # follow the steps
    # copy certs to <dir> ssl directory using the commands in final output
    ```
2. To renew the cert
    ```
    cd nginx-docker/letsencrypt
    # Script needs to be finalized and tested first 
    # sudo ./renew-ssl-cert.sh
    ```
   
   Example crontab record to renew the cert:
   ```
   3 5 1 */2 * (PATH=${PATH}:/usr/local/bin && cd /home/ec2-user/prod/<dir>/nginx-docker/letsencrypt && HOST_NAME=my.dns.example.com ./renew-ssl-cert.sh >> /home/ec2-user/prod/letsencrypt.log 2>&1)
   ```
   (renew every 2 months on 1st day of month at 5:03am UTC)
