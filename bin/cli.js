#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const fs = require("fs-extra");
const yaml = require("js-yaml");
const isValid = require('is-valid-path');
const run = require('../index');

async function collectNodeDetails(dir) {
    function validateNotEmpty(input) {
        return input !== "";
    }

    const prompts = [
        {
            message: "Your STRATO node's URL (including http:// and port number):",
            name: "stratoNodeURL",
            validate: validateNotEmpty
        },
        {
            name: "appTokenCookieName",
            default: `${dir}_session`
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

    const configuration = await inquirer.prompt(prompts);
    return configuration;
}

function checkPathValidity(path) {
    if (!isValid(path)) {
        console.error('\x1b[31m%s\x1b[0m', `${path} is not a valid path\n`);
        program.outputHelp();
        process.exit(1);
    }
}

program
    .description('This utility instantiates a STRATO application. It will create the directory <project-name>, and initialize the STRATO dapp.')
    .version(require('../package.json').version)
    .arguments('<project-name>')
    .option('-c, --config-file <configFile>', 'configuration file')
    .action(async (projectName, cmd) => {
        const { configFile } = cmd.opts();
        let configuration;

        checkPathValidity(projectName);

        if (configFile) {
            checkPathValidity(configFile);
            const configFileContent = fs.readFileSync(configFile, 'utf8');
            configuration = await yaml.safeLoad(configFileContent);
        } else {
            console.log(`\nPlease enter the following configuration parameters (contact Blockapps for credentials):\n`);
            configuration = await collectNodeDetails(projectName);
        }

        const options = {
            dir: projectName,
            configuration
        };
        run(options)
    });

program.parse(process.argv);
