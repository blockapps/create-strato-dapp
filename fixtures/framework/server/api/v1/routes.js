import express from "express";
const router = express.Router();
import moment from "moment";
import * as package from "../../package.json";
import { deployParamName } from "../../helpers/constants";

router.get(`/health`, (req, res) => {
  const deployment = req.app.get(deployParamName);
  res.json({
    name: package.name,
    name: package.name,
    description: package.description,
    version: package.version,
    timestamp: moment().unix(),
    deployment
  });
});

export default router;
