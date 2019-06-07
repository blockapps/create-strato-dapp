const ba = require("blockapps-rest")
import fs from "fs";
const common = ba.common;
const rest = ba.rest;
const {fsutil, util, cwd, importer }= common;
import config from "../../load.config";
import { yamlWrite } from "../../helpers/config";

const contractName = "FrameworkDapp";
const options = { config };

function deploy(user, contract) {
  // author the deployment
  // TODO: Write deploy.yaml instead of deploy.json

  const deployment = {
    url: options.config.nodes[0].url,
    contract: {
      name: contract.name,
      address: contract.address
    }
  };

  if (options.config.apiDebug) {
    console.log("deploy filename:", options.config.deployFilename);
    console.log(yamlSafeDumpSync(deployment));
  }

  yamlWrite(deployment, options.config.deployFilename);

  return deployment;
}

async function uploadContract(user) {
  const contractFileName = `${cwd}/${options.config.dappPath}/dapp/contracts/frameworkDapp.sol`;
  const uploadedContract = await rest.uploadContract(user, contractName, contractFileName, options);
  uploadContract.src = "removed";
  const bound = await bind(user, uploadedContract);
  return bound;
}

async function bind(user, _contract) {
  const contract = _contract;

  contract.deploy = async function(deplo) {
    const deployment = deploy(user, contract);
    return deployment;
  };

  // TODO: Write a sample manager pattern contract
  return contract;
}

export default {
  bind,
  uploadContract
};
