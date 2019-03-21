// TODO: use ES6
require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const bodyParser = require('body-parser');
const expressWinston = require('express-winston');
const winston = require('winston');
const { baseUrl, deployParamName } = require('./helpers/constants');
const routes = require('./api/v1/routes');
const cors = require('cors')
const { fsUtil, util } = require('blockapps-rest')

const app = express();

// Load deploy file
const deploy = fsUtil.get(`${util.cwd}/config/${process.env.CONFIG}.deploy.json`)
if(!deploy) throw new Error('Unable to locate deploy file')
app.set(deployParamName, JSON.parse(deploy))

// Setup middleware
app.use(helmet())
app.use(cors())
app.use(bodyParser.json())

// Setup logging
app.use(
  expressWinston.logger({
    transports: [
      new winston.transports.Console()
    ],
    meta: true,
    expressFormat: true
  })
);

// Setup routes
app.use(`${baseUrl}`, routes);

// TODO: Setup error handler

// Start the server
const port = process.env.PORT || 3030;
const server = app.listen(port, () => console.log(`Listening on ${port}`));

module.exports = server;
