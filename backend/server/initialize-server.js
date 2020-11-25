const Parse = require("parse/node");
//
// This function runs after starting the server
// You may add initialization code here
// e.g. create classes, default users/roles, enforce security, etc.
//
const initializeServer = async (config) => {
  // Parse.initialize(config.appId, null, config.masterKey);
  // Parse.serverURL = config.serverURL;
};

module.exports = initializeServer;
