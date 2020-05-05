import { assert, fsUtil, util } from 'blockapps-rest'
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

describe('Dapp Deployment tests', function () {
  this.timeout(config.timeout)

  const deployFilename = `./config/testdeploy.${util.uid()}.yaml`
  let admin, dappDeployArgs
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
