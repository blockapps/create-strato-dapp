const commander = require("commander");
const package = require("./package.json");
const fs = require("fs-extra");
const path = require("path");
const spawn = require("cross-spawn");
const inquirer = require("inquirer");
const yaml = require("js-yaml");
const log = console.log;
const error = console.error;
let directory;

const stratoDapp = new commander.Command("create <project-directory>")
  .version(package.version)
  .action((cmd, projectDir) => {
    directory = projectDir;
  })
  .parse(process.argv);

if (typeof directory === "undefined") {
  printUsage("Missing command!");
  process.exit();
}

if (typeof directory === "object") {
  printUsage("Please specify project name!");
  process.exit();
}

// TODO: regex check to make sure project name is a valid directory

const serverDirectory = `${directory}-server`;
const uiDirectory = `${directory}-ui`;
const nginxDirectory = "nginx-docker";


let answers = {};

async function collectNodeDetails() {
  function validateNotEmpty(input) {
    return input !== "";
  }

  const prompts = [
    {
      message: "Your STRATO node's URL (including the http://)",
      name: "stratoNodeURL",
      validate: validateNotEmpty
    },
    {
      name: "appTokenCookieName",
      default: `${directory}_session`
    },
    {
      name: "clientId",
      validate: validateNotEmpty
    },
    {
      name: "clientSecret",
      validate: validateNotEmpty
    },
    {
      name: "openIdDiscoveryUrl",
      validate: validateNotEmpty
    },
    {
      name: "redirectUri",
      default: `http://localhost/api/v1/authentication/callback`
    },
    {
      name: "logoutRedirectUri",
      default: `http://localhost`
    }
  ];

  answers = await inquirer.prompt(prompts);
}

function printUsage(errMsg) {
  error(errMsg);
  log(`Usage: ${package.name} create <project-name>`);
  log();
  log("For example:");
  log(`   ${package.name} create my-strato-dapp`);
}

async function run(dir) {
  // TODO: Check for dependencies - yarn, create-react-app, docker

  log(`Please enter the following configuration parameters:`);
  await collectNodeDetails();

  log(`Checking directory ${dir}...`);
  fs.ensureDirSync(dir);

  let startDir = process.cwd();
  process.chdir(`${startDir}/${dir}`);

  log(`Setting up your application. This might take a few minutes:`);
  log(`\tChecking git status...`);
  const gitResult = spawn.sync("git", ["status"]);
  if (gitResult.status !== 0) {
    log(`\t\tInitializing git...`);
    spawn.sync("git", ["init"]);
  }

  log(`\tCreating folder structure...`);
  fs.mkdirSync(serverDirectory);
  fs.mkdirSync(uiDirectory);
  fs.mkdirSync(nginxDirectory);

  log(`\tSetting up server`);
  log(`\t\tInitializing server package.json...`);
  process.chdir(serverDirectory);
  spawn.sync("yarn", ["init", "-yp"]);

  log(`\t\tInstalling server node modules...`);
  spawn.sync("yarn", ["add", "blockapps-rest@latest"]);
  spawn.sync("yarn", ["add", "express"]);
  spawn.sync("yarn", ["add", "helmet"]);
  spawn.sync("yarn", ["add", "body-parser"]);
  spawn.sync("yarn", ["add", "winston"]);
  spawn.sync("yarn", ["add", "express-winston"]);
  spawn.sync("yarn", ["add", "moment"]);
  spawn.sync("yarn", ["add", "chai"]);
  spawn.sync("yarn", ["add", "dotenv"]);
  spawn.sync("yarn", ["add", "mocha"]);
  spawn.sync("yarn", ["add", "cors"]);
  spawn.sync("yarn", ["add", "jwt-decode"]);
  spawn.sync("yarn", ["add", "--dev", "@babel/core"]);
  spawn.sync("yarn", ["add", "--dev", "@babel/cli"]);
  spawn.sync("yarn", ["add", "--dev", "@babel/node"]);
  spawn.sync("yarn", ["add", "--dev", "@babel/preset-env"]);
  spawn.sync("yarn", ["add", "--dev", "@babel/register"]);

  log(`\t\tCopying server fixtures...`);
  fs.copySync(`${__dirname}/fixtures/framework/server/`, "./");

  log("\t\tUpdating server configs...");
  let localhostConfig = await yaml.safeLoad(
    fs.readFileSync(`./config/localhost.config.yaml`, "utf8")
  );

  localhostConfig.nodes[0].oauth = {
    appTokenCookieName: answers.appTokenCookieName,
    scope: "email openid",
    appTokenCookieMaxAge: 7776000000, // 90 days: 90 * 24 * 60 * 60 * 1000
    clientId: answers.clientId,
    clientSecret: answers.clientSecret,
    openIdDiscoveryUrl: answers.openIdDiscoveryUrl,
    redirectUri: answers.redirectUri,
    logoutRedirectUri: answers.logoutRedirectUri
  };

  localhostConfig.nodes[0].url = answers.stratoNodeURL;

  let dockerConfig = JSON.parse(JSON.stringify(localhostConfig));
  dockerConfig.nodes[0].url = "http://nginx:80";
  dockerConfig.deployFilename = "config/docker.deploy.yaml";

  fs.writeFileSync(
    `./config/localhost.config.yaml`,
    await yaml.safeDump(localhostConfig)
  );
  fs.writeFileSync(
    `./config/docker.config.yaml`,
    await yaml.safeDump(dockerConfig)
  );

  let serverDockerFile = fs.readFileSync("Dockerfile", "utf-8");
  serverDockerFile = serverDockerFile.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("Dockerfile", serverDockerFile);

  let serverDockerRun = fs.readFileSync("docker-run.sh", "utf-8");
  serverDockerRun = serverDockerRun.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("docker-run.sh", serverDockerRun);

  log(`\t\tUpdating server scripts...`);
  const serverPackageJson = fs.readFileSync("package.json", "utf-8");
  const serverPackage = JSON.parse(serverPackageJson);
  serverPackage.scripts = {
    "token-getter":
      "node --require @babel/register node_modules/blockapps-rest/dist/util/oauth.client.js --flow authorization-code --config config/${SERVER:-localhost}.config.yaml",
    start: "babel-node index",
    deploy:
      "cp config/${SERVER:-localhost}.config.yaml config.yaml && mocha --require @babel/register dapp/dapp/dapp.deploy.js --config config/${SERVER:-localhost}.config.yaml",
    build: "cd blockapps-sol && yarn install && yarn build && cd .."
  };
  fs.writeFileSync("package.json", JSON.stringify(serverPackage, null, 2));

  log("\t\tInitializing blockapps-sol submodule");
  spawn.sync("git", [
    "submodule",
    "add",
    "-b",
    "SER-25_compatibilityWithRest",
    "https://github.com/blockapps/blockapps-sol"
  ]);
  spawn.sync("yarn", ["build"]);

  process.chdir(`${startDir}/${dir}`);

  log(`\tSetting up UI`);
  log(`\t\tInitializing create-react-app...`);
  spawn.sync("npx", ["create-react-app", uiDirectory]);

  log(`\t\tInstalling ui node modules...`);
  process.chdir(uiDirectory);
  spawn.sync("yarn", ["add", "@blueprintjs/core"]);
  spawn.sync("yarn", ["add", "connected-react-router"]);
  spawn.sync("yarn", ["add", "history"]);
  spawn.sync("yarn", ["add", "normalize.css"]);
  spawn.sync("yarn", ["add", "prop-types@^15.0.0"]);
  spawn.sync("yarn", ["add", "react-redux"]);
  spawn.sync("yarn", ["add", "react-router"]);
  spawn.sync("yarn", ["add", "react-router-dom"]);
  spawn.sync("yarn", ["add", "redux"]);
  spawn.sync("yarn", ["add", "redux-logger"]);
  spawn.sync("yarn", ["add", "redux-saga"]);

  log(`\t\tCopying ui fixtures...`);
  fs.copySync(`${__dirname}/fixtures/framework/ui/`, "./");

  log(`\t\tUpdating ui scripts...`);
  const uiPackageJson = fs.readFileSync("package.json", "utf-8");
  const uiPackage = JSON.parse(uiPackageJson);
  uiPackage.scripts = {
    ...uiPackage.scripts,
    develop: "REACT_APP_URL=http://localhost yarn start"
  };
  fs.writeFileSync("package.json", JSON.stringify(uiPackage, null, 2));

  let uiDockerFile = fs.readFileSync("Dockerfile", "utf-8");
  uiDockerFile = uiDockerFile.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("Dockerfile", uiDockerFile);

  let uiDockerRun = fs.readFileSync("docker-run.sh", "utf-8");
  uiDockerRun = uiDockerRun.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("docker-run.sh", uiDockerRun);

  process.chdir(`${startDir}/${dir}`);

  log(`\t\tSetting up docker`);

  process.chdir(`${nginxDirectory}`);
  fs.copySync(`${__dirname}/fixtures/framework/nginx-docker/`, "./");

  let nginxDockerCompose = fs.readFileSync("docker-compose.yml", "utf-8");
  nginxDockerCompose = nginxDockerCompose.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("docker-compose.yml", nginxDockerCompose);

  let nginxNoSslDocker = fs.readFileSync("nginx-nossl-docker.conf", "utf-8");
  nginxNoSslDocker = nginxNoSslDocker.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("nginx-nossl-docker.conf", nginxNoSslDocker);

  let nginxSslDocker = fs.readFileSync("nginx-ssl-docker.conf", "utf-8");
  nginxSslDocker = nginxSslDocker.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("nginx-ssl-docker.conf", nginxSslDocker);

  process.chdir(`${startDir}/${dir}`);

  fs.copyFileSync(
    `${__dirname}/fixtures/framework/docker-compose.yml`,
    "docker-compose.yml"
  );
  fs.copyFileSync(
    `${__dirname}/fixtures/framework/.dockerignore`,
    ".dockerignore"
  );

  let dockerCompose = fs.readFileSync("docker-compose.yml", "utf-8");
  dockerCompose = dockerCompose.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("docker-compose.yml", dockerCompose);

  log(`\t\tUpdating README`);
  fs.copyFileSync(`${__dirname}/fixtures/framework/README.md`, "README.md");

  let readme = fs.readFileSync("README.md", "utf-8");
  readme = readme.replace(/<dir>/g, `${dir}`);
  readme = readme.replace(/<client-id>/g, `${answers.clientId}`);
  readme = readme.replace(/<client-secret>/g, `${answers.clientSecret}`);
  readme = readme.replace(/<discovery-url>/g, `${answers.openIdDiscoveryUrl}`);
  fs.writeFileSync("README.md", readme);

  // TODO: Print usage instructions
  log("Happy Building! :) ");
}

run(directory);
