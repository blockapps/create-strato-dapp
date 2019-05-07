import express from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import expressWinston from "express-winston";
import winston from "winston";
import { baseUrl, deployParamName } from "./helpers/constants";
import routes from "./api/v1/routes";
import cors from "cors";
import { fsUtil } from "blockapps-rest";
import config from "./load.config";

const app = express();

// Load deploy file
const deploy = fsUtil.getYaml(config.deployFilename);
if (!deploy) {
  throw new Error(`Deploy file '${config.deployFilename}' not found`);
}
app.set(deployParamName, deploy);

app.set(deployParamName, JSON.parse(deploy));

// Setup middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

// Setup logging
app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
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

export default server;
