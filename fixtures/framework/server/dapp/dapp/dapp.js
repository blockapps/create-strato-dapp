const { rest, util, fsUtil } = require('blockapps-rest')
const contractName = 'FrameworkDapp'
const fs = require('fs')

function deploy(user, contract, options) {
  // author the deployment
  // TODO: Write deploy.yaml instead of deploy.json

  const deployment = {
    url: options.config.nodes[0].url,
    contract: {
      name: contract.name,
      address: contract.address
    }
  }

  fs.writeFileSync(`${util.cwd}/config/${process.env.CONFIG}.deploy.json`, JSON.stringify(deployment, null, 2))

  return deployment
}

async function uploadContract(user, options) {
  const source = fsUtil.get(`${util.cwd}/${options.config.dappPath}/dapp/contracts/frameworkDapp.sol`)
  const contract = {
    name: contractName,
    source, 
    args: {}
  }
  const uploadedContract = await rest.createContract(user, contract, options)
  const bound = await bind(user, uploadedContract)
  return bound
}

async function bind(user, _contract) {
  const contract = _contract

  contract.deploy = (options) => {
    const deployment = deploy(user, contract, options)
    return deployment
  } 

  // TODO: Write a sample manager pattern contract

  return contract
}


module.exports = {
  bind,
  uploadContract
}