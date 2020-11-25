const path = require("path");
const express = require("express");
const cors = require("cors");
const { default: ParseServer, ParseGraphQLServer } = require("parse-server");

const config = require("../config");
const initializeServer = require("./initialize-server");
const initializeCMS = require("../cms/initialize-cms");
const createDashboard = require("./dashboard");

if (!config.databaseURI) {
  console.log("DATABASE_URI not specified, falling back to localhost.");
}

const {
  appId,
  mountPath,
  publicServerURL,
  startLiveQueryServer,
  mountGraphQL,
  graphQLPath,
} = config;

const {
  host,
  port,
  dashboardEnabled,
  dashboardPath,
  cmsEnabled,
  chiselCmsDistPath,
} = config.extraConfig;

const app = express();

app.use(cors());

const parseServer = new ParseServer(config);

app.use("/public", express.static(path.join(__dirname, "../public")));

app.use(mountPath, parseServer.app);

if (mountGraphQL) {
  const parseGraphQLServer = new ParseGraphQLServer(parseServer, {
    graphQLPath,
  });
  parseGraphQLServer.applyGraphQL(app);
}

if (dashboardEnabled) {
  const dashboard = createDashboard(config);
  app.use(dashboardPath, dashboard);
}

if (cmsEnabled) {
  app.use("/", express.static(path.resolve(__dirname, chiselCmsDistPath)));

  app.get("/chisel-config.json", (req, res) => {
    const response = {
      configServerURL: publicServerURL,
      configAppId: appId,
    };
    return res.json(response);
  });

  app.use("/*", (req, res) =>
    res.sendFile(path.resolve(__dirname, chiselCmsDistPath, "index.html"))
  );
}

const httpServer = require("http").createServer(app);

if (startLiveQueryServer) {
  ParseServer.createLiveQueryServer(httpServer);
}

httpServer.listen(port, async () => {
  await initializeServer(config);
  await initializeCMS(config);
  const serverUrl = port === 443 ? `${host}` : `${host}:${port}`;
  console.log(`Parse server is running on https://${serverUrl}${mountPath}`);

  if (startLiveQueryServer) {
    console.log(`Live Query server is enabled`);
  } else {
    console.log(`Live Query server is disabled`);
  }
  if (mountGraphQL) {
    console.log(
      `GraphQl server is running on https://${serverUrl}${graphQLPath}`
    );
  } else {
    console.log(`GraphQl server is disabled`);
  }
  if (dashboardEnabled) {
    console.log(`Dashboard is enabled on https://${serverUrl}${dashboardPath}`);
  } else {
    console.log(`Dashboard is disabled`);
  }
  if (cmsEnabled) {
    console.log(`CMS is enabled on https://${serverUrl}`);
  } else {
    console.log(`CMS is disabled`);
  }
});
