const config = require("../config");

const parseConfig = {
  ...config,
  port: config.extraConfig.port,
  URLserver: config.publicServerURL,
  URLdb: config.databaseURI,
  URLsite: `https://${config.extraConfig.host}:${config.extraConfig.port}`,
};

module.exports.parseConfig = parseConfig;
module.exports.URL_SITE = parseConfig.URLsite;
module.exports.StripeConfig = config.extraConfig.StripeConfig;
