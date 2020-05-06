import { assert, fsUtil, util } from 'blockapps-rest'
import RestStatus from "http-status-codes";
import config from '../../../load.config'
import oauthHelper from "../../../helpers/oauthHelper";
import dappJs from '../dapp'


const testName = 'deploy.test'

const options = { config, name: testName, logger: console }

describe('Dapp Deployment tests', function () {
  this.timeout(config.timeout)

  const deployFilename = `./config/testdeploy.${util.uid()}.yaml`
  let admin
  let adminCredentials
  
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
  })

  it('should upload dapp contracts', async () => {
    const dapp = await dappJs.uploadContract(admin, options)
    const { owner } = await dapp.getState()
    assert.isDefined(owner)
  })

  it('should deploy dapp - write deploy.yaml', async () => {
    const dapp = await dappJs.uploadContract(admin, options)
    const args = { deployFilename, applicationUser: admin }

    const deployment = await dapp.deploy(args)
    assert.isDefined(deployment.dapp.contract)
    assert.isDefined(deployment.dapp.contract.address)
    assert.equal(deployment.dapp.contract.address, dapp.address)
  })

  it('should load dapp from deployment', async () => {
    {
      const dapp = await dappJs.uploadContract(admin, options)
      const args = { deployFilename, applicationUser: admin }
      const deployment = await dapp.deploy(args)
      assert.isDefined(deployment.dapp.contract)
    }

    const deployment = fsUtil.getYaml(deployFilename)
    const dapp = await dappJs.bind(admin, deployment.dapp.contract, options)

    const { owner } = await dapp.getState()
    assert.isDefined(owner)
  })
})
