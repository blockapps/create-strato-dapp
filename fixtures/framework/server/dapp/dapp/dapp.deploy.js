import { assert } from "chai";
import config from "../../load.config";
import dappJs from "./dapp";
import dotenv from "dotenv";
import oauthHelper from "../../helpers/oauthHelper";
import RestStatus from "http-status-codes";

const loadEnv = dotenv.config();
assert.isUndefined(loadEnv.error);

const options = { config, logger: console };
const adminCredentials = { token: process.env.ADMIN_TOKEN };

describe("Framework Dapp - deploy contracts", function() {
  this.timeout(config.timeout);

  let adminUser;

  before(async () => {
    assert.isDefined(
      config.deployFilename,
      "Deployment filename (output) argument missing. Set in config"
    );
    assert.isDefined(process.env.ADMIN_TOKEN, "ADMIN_TOKEN should be defined");
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
    const deployment = dapp.deploy(options);
    assert.isDefined(deployment);
    assert.equal(deployment.contract.address, dapp.address);
  });
});
