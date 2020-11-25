const ParseDashboard = require("../../Parse-Dashboard/app");

const createDashboard = (config) => {
  const dashboardConfig = {
    apps: [
      {
        serverURL: config.publicServerURL,
        appId: config.appId,
        masterKey: config.masterKey,
        appName: config.appName,
        graphQLServerURL: config.graphQLPath,
      },
    ],
    trustProxy: 1,
    allowInsecureHTTP: 1,
  };

  if (
    process.env.PARSE_DASHBOARD_USER_ID &&
    process.env.PARSE_DASHBOARD_USER_PASSWORD
  )
    dashboardConfig.users = [
      {
        user: process.env.PARSE_DASHBOARD_USER_ID,
        pass: process.env.PARSE_DASHBOARD_USER_PASSWORD,
      },
    ];

  return new ParseDashboard(dashboardConfig, {
    allowInsecureHTTP: true,
  });
};

module.exports = createDashboard;
