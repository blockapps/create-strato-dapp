# <dir>

## Setup and Execution

### Dependencies

The following tools should already be installed

1. docker
2. docker-compose


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


### Executing for Development

#### Start nginx

```
cd <dir>/nginx-docker
```

If you are running on Linux, execute the following command:
```
HOST_IP=172.17.0.1 docker-compose up -d
```

If you are running on Mac, execute the following command:
```
HOST_IP=docker.for.mac.localhost docker-compose up -d
```



Nginx acts as a proxy for the frontend and the backend. It is required so that both the frontend and the backend have the same root URL (required for authentication).

#### Deploy the Dapp and Start The Backend

```
cd <dir>/<dir>-server
yarn deploy
yarn build-blockapps-sol
yarn start
```

*NOTE: `yarn start` will start the server and use the terminal window to dump log information. To stop the server, hit `CTRL+C`*.



#### Launch UI

In a new terminal window, run the following commands:

```
cd <dir>/<dir>-ui
yarn install
yarn develop
```

This should open a browser window and display a basic React webpage.

*NOTE: `yarn develop` will start the UI and use the terminal window to dump log information. To stop the UI, hit `CTRL+C`*.

#### Stopping the App

To stop the app, hit `CTRL+C` on the server and UI windows. To stop the nginx server, run
```
docker stop nginx-docker_nginx_1
```

You will need to stop the nginx server if you want to get a new `ADMIN_TOKEN`, as the `token-getter` utility launches a web server on the same port. 




