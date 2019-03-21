const router = require('express').Router();
const moment = require('moment');
const package = require('../../package.json');
const { deployParamName } = require('../../helpers/constants');

router.get(`/health`, (req,res) => {
  const deployment = req.app.get(deployParamName)
  res.json({
    name: package.name,
    name: package.name,
    description: package.description,
    version: package.version,
    timestamp: moment().unix(),
    deployment
  })
})

module.exports = router