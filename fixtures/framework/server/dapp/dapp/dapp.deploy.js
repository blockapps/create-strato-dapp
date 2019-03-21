if(!process.env.ADMIN_TOKEN || ! process.env.CONFIG) {
  require('dotenv').config();
}
const dappJs = require('./dapp')
const { rest, fsUtil, util } = require('blockapps-rest')
const { assert } = require('chai')

assert.isDefined(process.env.CONFIG)

const config = fsUtil.getYaml(`${util.cwd}/config/${process.env.CONFIG}.config.yaml`);
const options = { config, logger: console }

describe('Framework Dapp - deploy contracts', function() {
  this.timeout(config.timeout)

  let adminUser

  before(async () => {
    assert.isDefined(process.env.ADMIN_TOKEN)

    adminUser = await rest.createUser({ token: process.env.ADMIN_TOKEN }, options)
    assert.isDefined(adminUser.address)
  })

  it('should upload all the contracts', async () => {  
    const dapp = await dappJs.uploadContract(adminUser, options)
    const deployment = dapp.deploy(options)
    assert.isDefined(deployment)
    assert.equal(deployment.contract.address, dapp.address)
  })
})