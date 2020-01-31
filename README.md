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
Clone the repository. From outside the repository folder, run

```
node app-framework/index.js create <project-name>
```

The above command prompts the user for OAuth details, creates a directory with `<project-name>` and initializes the STRATO app. After a project has been initialized, please look at the project `README` for instructions on how to execute the project.

## Assumptions

This utility makes the following assumptions:

1. STRATO is executing on localhost on port 8080
2. The application will execute on port 80 on `localhost`
3. STRATO is being executed with `OAUTH_ENABLED` and user has OAuth details for the relevant identity server

It is possible to setup the application for a different environment by modifying the config that is generated under `project-name-server/config` directory.
