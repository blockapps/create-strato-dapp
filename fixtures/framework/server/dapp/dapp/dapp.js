import { rest, importer } from "blockapps-rest";
const { createContract } = rest;
import config from "../../load.config";
import { yamlWrite, yamlSafeDumpSync } from "../../helpers/config";

const contractName = "FrameworkDapp";
const contractFilename = `${config.dappPath}/dapp/contracts/frameworkDapp.sol`;

function deploy(contract, args, options) {
  // author the deployment
  const { deployFilename } = args

  const deployment = {
    url: options.config.nodes[0].url,
    dapp: {
      contract: {
        name: contract.name,
        address: contract.address
      }
    }
  };

  if (options.config.apiDebug) {
    console.log("deploy filename:", deployFilename);
    console.log(yamlSafeDumpSync(deployment));
  }

  yamlWrite(deployment, deployFilename);

  return deployment;
}

async function uploadContract(token, options) {
  const source = await importer.combine(contractFilename)
  const contractArgs = {
    name: contractName,
    source
  };

  const contract = await createContract(token, contractArgs, options);
  contract.src = "removed";

  return bind(token, contract, options);
}

function bind(rawAdmin, _contract, defaultOptions) {
  const contract = _contract;
  const dappAddress = contract.address
  const admin = { dappAddress, ...rawAdmin }

  contract.getState = async function (args, options = defaultOptions) {
    return rest.getState(admin, contract, options)
  }

  contract.deploy = function (args, options = defaultOptions) {
    const deployment = deploy(contract, args, options);
    return deployment;
  };
  // TODO: Write a sample manager pattern contract
  return contract;
}

export default {
  bind,
  uploadContract
};
