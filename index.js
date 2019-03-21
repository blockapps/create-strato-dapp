const commander = require('commander')
const package = require('./package.json')
const fs = require('fs-extra')
const path = require('path')
const spawn = require('cross-spawn')
const log = console.log
const error = console.error
let directory



const stratoDapp = new commander.Command('create <project-directory>')
  .version(package.version)
  .action((cmd, projectDir) => { 
    directory = projectDir
  })
  .parse(process.argv)

if(typeof directory === 'undefined') {
  printUsage('Missing command!')
  process.exit()
}

if(typeof directory === 'object') {
  printUsage('Please specify project name!')
  process.exit()
}

// TODO: regex check to make sure project name is a valid directory

const serverDirectory = `${directory}-server`
const uiDirectory = `${directory}-ui`
const nginxDirectory = 'nginx-docker'

function printUsage(errMsg) { 
  error(errMsg)
  log(`Usage: ${package.name} create <project-name>`) 
  log()
  log('For example:')
  log(`   ${package.name} create my-strato-dapp`)
}

function run(
  dir
) {
  // TODO: Check for dependencies - yarn, create-react-app, docker
  log(`Ensuring directory ${dir}...`)
  fs.ensureDirSync(dir)

  
  let startDir = process.cwd();
  process.chdir(`${startDir}/${dir}`)
  
  log(`Setting up your application. This might take a few minutes:`)
  log(`\tChecking git status...`)
  const gitResult = spawn.sync('git', ['status'])
  if(gitResult.status !== 0) {
    log(`\t\tInitializing git...`)
    spawn.sync('git',['init']) 
  }

  log(`\tCreating folder structure...`)
  fs.mkdirSync(serverDirectory)
  fs.mkdirSync(uiDirectory)
  fs.mkdirSync(nginxDirectory)

  log(`\tSetting up server`)
  log(`\t\tInitializing server package.json...`)
  process.chdir(serverDirectory)
  spawn.sync('yarn',['init', '-yp'])
  
  log(`\t\tInstalling server node modules...`)
  spawn.sync('yarn',['add', 'blockapps-rest@alpha'])
  spawn.sync('yarn',['add', 'express'])
  spawn.sync('yarn',['add', 'helmet'])
  spawn.sync('yarn',['add', 'body-parser'])
  spawn.sync('yarn',['add', 'winston'])
  spawn.sync('yarn',['add', 'express-winston'])
  spawn.sync('yarn',['add', 'moment'])
  spawn.sync('yarn',['add', 'chai'])
  spawn.sync('yarn',['add', 'dotenv'])
  spawn.sync('yarn',['add', 'mocha'])
  spawn.sync('yarn',['add', 'cors'])
  // TODO: git submodule init blockapps-sol

  log(`\t\tCopying server fixtures...`)
  fs.copySync(`${__dirname}/fixtures/framework/server/`, './')

  log(`\t\tUpdating server scripts...`)
  const serverPackageJson = fs.readFileSync('package.json','utf-8')
  const serverPackage = JSON.parse(serverPackageJson)
  serverPackage.scripts = {
    start: 'node index',
    deploy: 'mocha dapp/dapp/dapp.deploy.js -b'
  }
  fs.writeFileSync('package.json', JSON.stringify(serverPackage,null,2))

  process.chdir(`${startDir}/${dir}`)

  log(`\tSetting up UI`)
  log(`\t\tInitializing create-react-app...`)
  spawn.sync('create-react-app',[uiDirectory])

  log(`\t\tInstalling ui node modules...`)
  process.chdir(uiDirectory)
  spawn.sync('yarn',['add', '@blueprintjs/core'])
  spawn.sync('yarn',['add', 'connected-react-router'])
  spawn.sync('yarn',['add', 'history'])
  spawn.sync('yarn',['add', 'normalize.css'])
  spawn.sync('yarn',['add', 'prop-types@^15.0.0'])
  spawn.sync('yarn',['add', 'react-redux'])
  spawn.sync('yarn',['add', 'react-router'])
  spawn.sync('yarn',['add', 'react-router-dom'])
  spawn.sync('yarn',['add', 'redux'])
  spawn.sync('yarn',['add', 'redux-logger'])
  spawn.sync('yarn',['add', 'redux-saga'])

  log(`\t\tCopying ui fixtures...`)
  fs.copySync(`${__dirname}/fixtures/framework/ui/`, './')

  log(`\t\tUpdating ui scripts...`)
  const uiPackageJson = fs.readFileSync('package.json','utf-8')
  const uiPackage = JSON.parse(uiPackageJson)
  uiPackage.scripts = {
    ...uiPackage.scripts,
    develop: 'REACT_APP_URL=http://localhost:3030 yarn start'
  }
  fs.writeFileSync('package.json', JSON.stringify(uiPackage,null,2))


  process.chdir(`${startDir}/${dir}`)

  // TODO: dockerize

  // TODO: Print usage instructions 
  log('Happy BUIDLing!')
}

run(directory)



