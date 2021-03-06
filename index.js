const fs = require("fs-extra");
const yaml = require("js-yaml");
const spawn = require("cross-spawn");
const log = console.log;
const error = console.error;

async function run(options) {
  const { dir, configuration } = options;

  // TODO: Check for dependencies - yarn, create-react-app, docker
  const serverDirectory = `${dir}-server`;
  const uiDirectory = `${dir}-ui`;
  const seleniumDirectory = `${dir}-selenium`;
  const nginxDirectory = "nginx-docker";

  log(`Welcome to the STRATO app-framework utility.`);
  log(`This tool will generate a basic framework for an application built on STRATO,`);
  log(`including a React UI and a NodeJS server, integrated with Blockapps-Rest SDK.`);
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
  fs.mkdirSync(seleniumDirectory);
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
    appTokenCookieName: configuration.appTokenCookieName,
    scope: "email openid",
    appTokenCookieMaxAge: 7776000000, // 90 days: 90 * 24 * 60 * 60 * 1000
    clientId: configuration.clientId,
    clientSecret: configuration.clientSecret,
    openIdDiscoveryUrl: configuration.openIdDiscoveryUrl,
    redirectUri: configuration.redirectUri,
    logoutRedirectUri: configuration.logoutRedirectUri
  };

  localhostConfig.nodes[0].url = configuration.stratoNodeURL;

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
      "babel-node node_modules/blockapps-rest/dist/util/oauth.client.js --flow authorization-code --config config/${SERVER:-localhost}.config.yaml",
    start: "babel-node index",
    "start:prod": "NODE_ENV=production babel-node index",
    deploy: "cp config/${SERVER:-localhost}.config.yaml ${CONFIG_DIR_PATH:-.}/config.yaml && mocha --require @babel/register dapp/dapp/dapp.deploy.js --config ${CONFIG_DIR_PATH:-.}/config.yaml",
    "test:dapp": "mocha --require @babel/register dapp/dapp/test/dapp.test.js -b",
    "test:e2e": "mocha --require @babel/register dapp/dapp/test/e2e.test.js -b",
    "test": "yarn test:dapp && yarn test:e2e"
  };
  fs.writeFileSync("package.json", JSON.stringify(serverPackage, null, 2));

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
    develop: "REACT_APP_URL=http://localhost yarn start",
    test: "react-scripts test --env=jsdom",
    "test:ci": "CI=true react-scripts test --env=jsdom --passWithNoTests"
  };
  fs.writeFileSync("package.json", JSON.stringify(uiPackage, null, 2));

  let uiDockerFile = fs.readFileSync("Dockerfile", "utf-8");
  uiDockerFile = uiDockerFile.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("Dockerfile", uiDockerFile);

  let uiDockerRun = fs.readFileSync("docker-run.sh", "utf-8");
  uiDockerRun = uiDockerRun.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("docker-run.sh", uiDockerRun);

  process.chdir(`${startDir}/${dir}`);

  log(`\tSetting up selenium`);
  log(`\t\tInitializing selenium package.json...`);
  process.chdir(seleniumDirectory);
  spawn.sync("yarn", ["init", "-yp"]);

  log(`\t\tInstalling selenium node modules...`);
  spawn.sync("yarn", ["add", "mocha"]);
  spawn.sync("yarn", ["add", "chai"]);
  spawn.sync("yarn", ["add", "selenium-webdriver"]);
  spawn.sync("yarn", ["add", "--dev", "@babel/core"]);
  spawn.sync("yarn", ["add", "--dev", "@babel/preset-env"]);
  spawn.sync("yarn", ["add", "--dev", "@babel/register"]);

  log(`\t\tCopying selenium fixtures...`);
  fs.copySync(`${__dirname}/fixtures/framework/selenium/`, "./");

  log(`\t\tUpdating selenium scripts...`);
  const seleniumPackageJson = fs.readFileSync("package.json", "utf-8");
  const seleniumPackage = JSON.parse(seleniumPackageJson);
  seleniumPackage.scripts = {
    "mocha-babel": "mocha --require @babel/register",
    "test:selenium": "yarn mocha-babel test/* -b"
  };
  fs.writeFileSync("package.json", JSON.stringify(seleniumPackage, null, 2));
  
  process.chdir(`${startDir}/${dir}`);

  log(`\t\tSetting up docker`);

  process.chdir(`${nginxDirectory}`);
  fs.copySync(`${__dirname}/fixtures/framework/nginx-docker/`, "./");

  let nginxDockerCompose = fs.readFileSync("docker-compose.yml", "utf-8");
  nginxDockerCompose = nginxDockerCompose.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("docker-compose.yml", nginxDockerCompose);

  let nginxConfig = fs.readFileSync("nginx.tpl.conf", "utf-8");
  nginxConfig = nginxConfig.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("nginx.tpl.conf", nginxConfig);

  let letsenryptRenewTool = fs.readFileSync(
    "letsencrypt/renew-ssl-cert.sh",
    "utf-8"
  );
  letsenryptRenewTool = letsenryptRenewTool.replace(/<dir>/g, `${dir}`);
  fs.writeFileSync("letsencrypt/renew-ssl-cert.sh", letsenryptRenewTool);

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
  readme = readme.replace(/<client-id>/g, `${configuration.clientId}`);
  readme = readme.replace(/<client-secret>/g, `${configuration.clientSecret}`);
  readme = readme.replace(
    /<discovery-url>/g,
    `${configuration.openIdDiscoveryUrl}`
  );
  fs.writeFileSync("README.md", readme);

  log(`Done\n`);
  log(`Enter the ${dir} directory and check README.md to get started`);
  log("Happy building!");
}

module.exports = run;
