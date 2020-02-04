# app-framework

This utility instantiates a STRATO application. It performs the following steps

1. Setup OAuth config
2. Initialize backend skeleton
3. Initialize REACT UI
4. Setup docker packaging

## Dependencies

The following tools should already be installed

1. node
2. yarn

## Usage
1. Clone the repository.
``` 
git clone https://github.com/blockapps/app-framework.git
```

2. From **outside** the repository folder, run the following command:

```
node app-framework/index.js create <project-name>
```

3. Enter your node's configuration information when prompted. If there is a default shown, simply hit ENTER to accept it.

4. When you have answered all of the prompts, the script will execute (it may take a couple of minutes). It will create the directory `<project-name>`, and initialize the STRATO dapp. After it finishes, enter the project directory and follow the included `README` for further instructions on executing the app.


## Assumptions

This utility makes the following assumptions:

1. The application will execute on `localhost`
2. STRATO is running on a remote node with `OAUTH_ENABLED` and the user has OAuth details for the relevant identity server

It is possible to setup the application for a different environment by modifying the config that is generated under `project-name-server/config` directory.
