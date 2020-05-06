import { assert } from "chai";
import config from "../../load.config";
import dappJs from "./dapp";
import oauthHelper from "../../helpers/oauthHelper";
import RestStatus from "http-status-codes";


const options = { config, logger: console };

describe("Framework Dapp - deploy contracts", function() {
  this.timeout(config.timeout);

  let adminCredentials;
  let adminUser;

  before(async () => {
    assert.isDefined(
      config.deployFilename,
      "Deployment filename (output) argument missing. Set in config"
    );
    let serviceUserToken;
    try {
      serviceUserToken = await oauthHelper.getServiceToken()
    } catch(e) {
      console.error("ERROR: Unable to fetch the service user token, check your OAuth settings in config", e);
      throw e
    }
    adminCredentials = { token: serviceUserToken };
    const adminEmail = oauthHelper.getEmailIdFromToken(adminCredentials.token);
    console.log("Creating admin", adminEmail);
    const adminResponse = await oauthHelper.createStratoUser(
      adminCredentials,
      adminEmail
    );
    assert.strictEqual(
      adminResponse.status,
      RestStatus.OK,
      adminResponse.message
    );
    adminUser = adminResponse.user;
  });

  it("should upload all the contracts", async () => {
    const dapp = await dappJs.uploadContract(adminUser, options);
    const deployArgs = { deployFilename: options.config.deployFilename }
    const deployment = dapp.deploy(deployArgs);
    assert.isDefined(deployment);
    assert.equal(deployment.dapp.contract.address, dapp.address);
  });
});
