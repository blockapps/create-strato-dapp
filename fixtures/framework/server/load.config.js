const ba = require('blockapps-rest');
const common = ba.common;
const fsutil = common.fsutil;

let config;

if (!config) {
  config = fsutil.getYaml(
    `config/${
      process.env.SERVER ? process.env.SERVER : "localhost"
    }.config.yaml`
  );
}

export default config;
