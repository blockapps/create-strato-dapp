import { assert } from 'blockapps-rest'
import dotenv from "dotenv";
import RestStatus from "http-status-codes";
import config from '../../../load.config'
import oauthHelper from "../../../helpers/oauthHelper";
import dappJs from '../dapp'

const loadEnv = dotenv.config();
assert.isUndefined(loadEnv.error);

const testName = 'deploy.test'

const options = { config, name: testName, logger: console }

const adminCredentials = { token: process.env.ADMIN_TOKEN };

describe('E2E tests', function () {
  this.timeout(config.timeout)

  let admin
  let dapp
  before(async () => {
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
    admin = adminResponse.user;

    dapp = await dappJs.uploadContract(admin, options)
  })

  it('should get valid deployment state', async () => {
    const state = await dapp.getState()
    assert.isDefined(state.owner)
  })
})
