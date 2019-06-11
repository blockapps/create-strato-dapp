import express from "express";
const router = express.Router();
import moment from "moment";
import * as packageJson from "../../package.json";
import { deployParamName } from "../../helpers/constants";

router.get(`/health`, (req, res) => {
  const deployment = req.app.get(deployParamName);
  res.json({
    name: packageJson.name,
    name: packageJson.name,
    description: packageJson.description,
    version: packageJson.version,
    timestamp: moment().unix(),
    deployment
  });
});

// TODO: Authenticated route example

export default router;
