const commander = require('commander')
const package = require('./package.json');
const fs = require('fs-extra');
const path = require('path');
let directory;

const stratoDapp = new commander.Command('create <project-directory>')
  .version(package.version)
  .action((cmd, projectDir) => { 
    directory = projectDir;
  })
  .parse(process.argv);

if(typeof directory === 'undefined') {
  printUsage('Missing command!')
}

if(typeof directory === 'object') {
  printUsage('Please specify project directory!')
}

run(directory)

function run(
  dir
) {
  fs.ensureDirSync(dir)
  fs.copySync('./fixtures/framework/', dir)
}

function printUsage(errMsg) { 
  console.error(errMsg)
  console.log(`Usage: ${package.name} create <project-directory>`) 
  console.log()
  console.log('For example:')
  console.log(`   ${package.name} create my-strato-dapp`)
}

