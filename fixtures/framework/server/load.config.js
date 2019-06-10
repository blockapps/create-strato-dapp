import { fsUtil } from "blockapps-rest";

let config;

if (!config) {
  config = fsUtil.getYaml(
    process.env.SERVER
      ? `config/${process.env.SERVER}.config.yaml`
      : `config.yaml`
  );
}

export default config;
