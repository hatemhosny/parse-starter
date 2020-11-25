const path = require("path");

const config = {
  // General Settings
  appId: process.env.PARSE_SERVER_APPLICATION_ID || "myAppId",
  masterKey: process.env.PARSE_SERVER_MASTER_KEY || "myMasterKey",
  appName: process.env.PARSE_SERVER_APP_NAME || "My App",
  serverURL: process.env.PARSE_SERVER_URL || "https://localhost:1337/api",
  publicServerURL:
    process.env.PARSE_PUBLIC_SERVER_URL || "https://localhost:1337/api",
  databaseURI:
    process.env.PARSE_SERVER_DATABASE_URI || "mongodb://mongo:27017/dev",
  mountPath: process.env.PARSE_SERVER_MOUNT_PATH || "/api",
  cloud: process.env.PARSE_SERVER_CLOUD || "/parse-server/cloud/main.js",

  // GraphQl
  mountGraphQL: true,
  graphQLPath: process.env.PARSE_SERVER_GRAPHQL_PATH || "/graphql",

  // LiveQuery
  startLiveQueryServer: true,
  liveQuery: { classNames: ["Todo"] },

  // Email
  verifyUserEmails: false,
  emailVerifyTokenValidityDuration: 2 * 60 * 60, // in seconds (2 hours = 7200 seconds)
  preventLoginWithUnverifiedEmail: false, // defaults to false
  emailAdapter: {
    module: "parse-smtp-template",
    options: {
      host: process.env.MAIL_SMTP_HOST || "smtp.sendgrid.net",
      port: process.env.MAIL_SMTP_PORT || 587,
      user: process.env.MAIL_SMTP_USERNAME || "user",
      password: process.env.MAIL_SMTP_PASSWORD || "pass",
      fromAddress:
        process.env.MAIL_FROM_ADDRESS || `admin@${process.env.HOST_NAME}`,
    },
  },
  customPages: {
    verifyEmailSuccess: "/public/verify_email_success.html",
    choosePassword: "/public/choose_password.html",
    passwordResetSuccess: "/public/password_reset_success.html",
    linkSendSuccess: "/public/link_send_success.html",
    linkSendFail: "/public/link_send_fail.html",
    invalidLink: "/public/invalid_link.html",
    invalidVerificationLink: "/public/invalid_verification_link.html",
  },
  extraConfig: {
    host: process.env.BACKEND_HOST_NAME || "localhost",
    port: Number(process.env.BACKEND_PORT) || 1337,
    dashboardEnabled: process.env.PARSE_DASHBOARD_ENABLED === "yes",
    dashboardPath: process.env.PARSE_DASHBOARD_PATH || "/dashboard",
    cmsEnabled: process.env.CMS_ENABLED === "yes",
    chiselCmsDistPath: path.resolve(__dirname, "node_modules/chisel-cms/dist"),
    cmsUserEmail: process.env.CMS_USER_EMAIL,
    cmsUserPassword: process.env.CMS_USER_PASSWORD,
    siteTemplates: true,
    // StripeConfig: {
    //   keyPublic: "pk_test_sample",
    //   keyPrivate: "sk_test_sample",
    // },
  },
};

module.exports = config;
