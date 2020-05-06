import { assert } from 'blockapps-rest'
import RestStatus from "http-status-codes";
import config from '../../../load.config'
import oauthHelper from "../../../helpers/oauthHelper";
import dappJs from '../dapp'


const testName = 'deploy.test'
const options = { config, name: testName, logger: console }

describe('E2E tests', function () {
  this.timeout(config.timeout)
  let admin
  let adminCredentials
  let dapp
  
  before(async () => {
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
    admin = adminResponse.user;

    dapp = await dappJs.uploadContract(admin, options)
  })

  it('should get valid deployment state', async () => {
    const state = await dapp.getState()
    assert.isDefined(state.owner)
  })
})
