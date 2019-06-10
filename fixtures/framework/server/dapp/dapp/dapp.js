import fs from "fs";
import { rest, util, importer } from "blockapps-rest";
const { createContract, getState, call } = rest;
import config from "../../load.config";
import { yamlWrite, yamlSafeDumpSync } from "../../helpers/config";

const contractName = "FrameworkDapp";
const contractFilename = `${config.dappPath}/dapp/contracts/frameworkDapp.sol`;
const options = { config };

function deploy(contract) {
  // author the deployment

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

async function uploadContract(token) {
  const contractArgs = {
    name: contractName,
    source: await importer.combine(contractFilename)
  };

  const contract = await createContract(token, contractArgs, options);
  contract.src = "removed";

  return bind(token, contract);
}

function bind(token, _contract) {
  const contract = _contract;

  contract.deploy = function() {
    const deployment = deploy(contract);
    return deployment;
  };
  // TODO: Write a sample manager pattern contract
  return contract;
}

export default {
  bind,
  uploadContract
};
