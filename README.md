# A powerful backend ready for your next app 🚀 <!-- omit in toc -->

This is a starter template with a feature-rich ready-to-use backend that works out of the box for local development and can be easily deployed.

You get a fully functional backend so that you can focus on what matters most: your app!

## Feature Summary <!-- omit in toc -->

- **[Parse server](https://github.com/parse-community/parse-server)**: Backend-as-a-Service (BaaS) that features:
  - [SDKs](https://parseplatform.org/#sdks) for popular platforms
  - [REST API](https://docs.parseplatform.org/rest/guide/)
  - [Graphql API](https://docs.parseplatform.org/graphql/guide/)
  - [LiveQuery](https://docs.parseplatform.org/parse-server/guide/#live-queries) for realtime apps
  - Security features including authentication, [users](https://docs.parseplatform.org/js/guide/#users), [roles](https://docs.parseplatform.org/js/guide/#roles), [access control lists (ACL)](https://docs.parseplatform.org/rest/guide/#object-level-access-control) and [class-level permissions (CLP)](https://docs.parseplatform.org/rest/guide/#class-level-permissions)
  - [3rd party authentication](https://docs.parseplatform.org/parse-server/guide/#oauth-and-3rd-party-authentication)
  - [Push notifications](https://docs.parseplatform.org/parse-server/guide/#push-notifications)
  - Adapters for [file storage](https://docs.parseplatform.org/parse-server/guide/#configuring-file-adapters) and [caching](https://docs.parseplatform.org/parse-server/guide/#configuring-cache-adapters)
  - [Analytics](https://docs.parseplatform.org/rest/guide/#analytics)
  - [Cloud code](https://docs.parseplatform.org/rest/guide/#cloud-code) for custom server-side logic
  - [Web hooks](https://docs.parseplatform.org/rest/guide/#hooks)
  - Runs on top of [Express](https://expressjs.com) allowing the use of Express middleware
  - Comprehensive [documentation](https://docs.parseplatform.org/)
  - Large [community](https://github.com/parse-community)
- **[MongoDB](https://www.mongodb.com)** database.
- **[Parse dashboard](https://github.com/parse-community/parse-dashboard)** (optional): a powerful dashboard for managing the parse server.
- **API-First Headless CMS** (optional): using [chisel-cms](https://chiselcms.com).
- A sample realtime **frontend app**.
- **Automatic HTTPS** for the frontend and backend using [Caddy server](https://caddyserver.com).
- Reproducible setup using **[Docker](https://www.docker.com/)** containers managed by a single **[Docker Compose](https://docs.docker.com/compose)** file.
- **Local development workflow** with hot reload for frontend and backend.
- **Easy deployment**.
- **CI/CD** ([continuous integration and deployment](https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment)): using [github actions](https://docs.github.com/en/free-pro-team@latest/actions).
- Optional **deployment to multiple environments** (e.g. development, staging and production).
- The whole stack is **open source** with no vendor lock-in or pay-per-request restrictions.

## Table of Contents <!-- omit in toc -->

- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
    - [Environment](#environment)
    - [Server Settings](#server-settings)
    - [Keys and Secrets](#keys-and-secrets)
    - [App Structure](#app-structure)
    - [Mail Settings](#mail-settings)
    - [Docker Settings](#docker-settings)
  - [Parse Server Configuration](#parse-server-configuration)
- [Data Persistance](#data-persistance)
- [Cloud Code](#cloud-code)
- [Static Files](#static-files)
- [Express Middleware](#express-middleware)
- [Parse Dashboard](#parse-dashboard)
- [Headless CMS](#headless-cms)
- [Automatic HTTPS](#automatic-https)
- [Frontend App](#frontend-app)
- [Local Development](#local-development)
  - [Running the Dev Server](#running-the-dev-server)
  - [Production Build](#production-build)
  - [Running Shell Commands on Containers](#running-shell-commands-on-containers)
  - [Installing Dependencies](#installing-dependencies)
  - [NPM Scripts](#npm-scripts)
- [Deployment](#deployment)
  - [Quick Start](#quick-start)
  - [CI/CD using github actions](#cicd-using-github-actions)
  - [Server Setup](#server-setup)
  - [Multiple Deployment Environments](#multiple-deployment-environments)
  - [Container Registry](#container-registry)
  - [Github Secrets](#github-secrets)
  - [Running Tests](#running-tests)
  - [Manual Re-Deploys](#manual-re-deploys)
  - [Using a Different Host Name for Backend (e.g. Subdomain)](#using-a-different-host-name-for-backend-eg-subdomain)
  - [Using a Remote MongoDB Database](#using-a-remote-mongodb-database)
- [Contributing](#contributing)
- [License](#license)

## Requirements

- [Docker](https://docs.docker.com/get-docker)
- [Docker Compose](https://docs.docker.com/compose)

## Getting Started

Run the shell command:

```sh
docker-compose up
```

By default, the following will be served:

- parse server backend: https://localhost:1337/api
- parse graphql API: https://localhost:1337/graphql
- parse dashboard: https://localhost:1337/dashboard
- frontend local dev server (with HMR): https://localhost:1234

After [production build](#production-build):

- frontend app: https://localhost

When [CMS is enabled](#headless-cms):

- chisel CMS: https://localhost:1337

Now you can edit/replace the app in the `frontend` directory and start building your own app making use of the feature-rich backend.

## Configuration

### Environment Variables

Several configuration options can be set using environments variables exposed while running the `docker-compose` command.
Please refer to docs on [Environment variables in Compose](https://docs.docker.com/compose/environment-variables) for different ways to achieve that.

Variables in `.env` file will be automatically used.

Note: [DO NOT commit secrets to version control](https://github.com/eth0izzle/shhgit/).

`.env` file is not tracked by git (added to `.gitignore`) to avoid accidentally committing secrets. A sample in provided in [sample.env](sample.env). You may rename it to `.env` for local development. For deployment, use [GitHub Secrets](#github-secrets) instead.

#### Environment

- **NODE_ENV**:

  If set to "development", running `docker-compose up` starts frontend local development server with hot module replracement (HMR) on port 1234, and watches the backend source code and reloads on changes (e.g. in cloud code).

  If set to "production", running `docker-compose up` triggers frontend build generating static files that will be served on the default port (443), and the backend server runs on `pm2` which restarts the server on crash.

  _valid values_: development, production

  _default_: development

#### Server Settings

- **HOST_NAME**:

  The DNS name for the server hosting the app. HTTPS is used automatically with TLS certificates issued and renewed from [Let's Encrypt](https://letsencrypt.org/). If "localhost" or an IP address is used, self-signed (locally trusted) certificates will be used.

  _examples_: mywebsite.com, blog.mywebsite.com

  _default_: localhost

  _Required for remote deployment_

- **BACKEND_PORT**:

  The port for backend server.

  _default_: 1337

- **PARSE_SERVER_PATH**:

  Route to parse-server REST API

  _default_: /api

- **PARSE_SERVER_GRAPHQL_PATH**:

  Route to parse-server graphql API

  _default_: /graphql

- **PARSE_DASHBOARD_PATH**:

  Route to parse dashboard

  _default_: /dashboard

- **PARSE_DASHBOARD_ENABLED**:

  Enables parse dashboard if set to "yes"

  _default_: yes

- **CMS_ENABLED**:

  Enables CMS if set to "yes"

  _default_: no

- **FRONTEND_DEV_SERVER_PORT**:

  The port for frontend development server

  _default_: 1234

- **HMR_PORT**:

  The port for hot module replacement (HMR) for frontend development server

  _default_: 1235

#### Keys and Secrets

- **APP_ID**:

  Parse server app id

  _default_: myappid

- **APP_NAME**:

  _default_: myappname

- **MASTER_KEY**:

  Parse server master key

  _default_: mymasterkey

- **PARSE_SERVER_DATABASE_URI**:

  Parse server database URI.

  By default it uses the included MongoDB container. You may change this if you wish to use another MongoDB instance.

  _default_: mongodb://mongo:27017/dev

- **PARSE_DASHBOARD_USER_ID**:

  Parse dashboard user ID

- **PARSE_DASHBOARD_USER_PASSWORD**:

  Parse dashboard user password

- **CMS_USER_EMAIL**:

  Chisel CMS user email

- **CMS_USER_PASSWORD**:

  Chisel CMS user password

#### App Structure

- **BACKEND_SRC_DIR**:

  The backend source code directory.

  _default_: backend

- **FRONTEND_SRC_DIR**:

  The frontend source code directory.

  _default_: frontend

- **FRONTEND_DIST_DIR**:

  The directory containing the frontend production build inside the frontend source code directory.

  _default_: dist

- **DATA_DIR**:

  The directory for data persistence (see [Data Persistance](#data-persistance)).

  _default_: data

- **BACKEND_NPM_SCRIPT**:

  The npm script to run after starting the backend container.

  _default_: start

- **FRONTEND_NPM_SCRIPT**:

  The npm script to run after starting the frontend container.

  _default_: start

#### Mail Settings

These settings are used to send mail from parse server (e.g. to verify user emails)

- **MAIL_SMTP_HOST**:

  SMTP host server

  _example_: smtp.sendgrid.net

- **MAIL_SMTP_PORT**:

  SMTP server port

  _default_: 587

- **MAIL_SMTP_USERNAME**:

  SMTP username

- **MAIL_SMTP_PASSWORD**:

  SMTP password

- **MAIL_FROM_ADDRESS**:

  The send-from email address

#### Docker Settings

- **BACKEND_IMAGE**:

  The docker image for backend

  _default for local build_: backend

  _default for CI/CD_: <span>docker.pkg.github</span>.com/{owner}/{repo}/{repo}-backend

- **FRONTEND_IMAGE**:

  The docker image for frontend

  _default for local build_: frontend

  _default for CI/CD_: <span>docker.pkg.github</span>.com/{owner}/{repo}/{repo}-frontend

- **IMAGE_TAG**:

  The tag for docker images

  _default for local build_: latest

  _default for CI/CD_: git short SHA

### Parse Server Configuration

Additional [parse server configurations](https://github.com/parse-community/parse-server#configuration) can be defined in [./backend/config.js](./backend/config.js)

## Data Persistance

The data generated (e.g. MongoDB data, parse server logs and caddy certificates) are stored by default in the `./data` directory (can be configured by the `DATA_DIR` [environment variable](#app-structure)).

## Cloud Code

[Cloud code](https://docs.parseplatform.org/cloudcode/guide/) can be used to run custom server-side logic. It is built on [Parse JavaScript SDK](http://parseplatform.org/Parse-SDK-JS/api).

The main entry to cloud code is [./backend/cloud/main.js](backend/cloud/main.js)

Any npm package can be installed in the backend and used (see [Installing Dependencies](#installing-dependencies)).

To run code on server start (e.g. creating default users and roles, enforcing security rules, ...etc.), add your code to [./backend/server/initialize-server.js](backend/server/initialize-server.js)

## Static Files

Files added to the directory [./backend/public](./backend/public) will be served by the backend server under the route `/public`.

## Express Middleware

Express middleware can be added to [./backend/server/index.js](./backend/server/index.js)

## Parse Dashboard

The [Parse dashboard](https://github.com/parse-community/parse-dashboard) is a powerful dashboard for managing the parse server. By default, it is enabled and accessible on the route `/dashboard` of the backend server (e.g. https://localhost:1337/dashboard)

It can be configured by setting the [environment variables](#environment-variables) similar to this example:

```
PARSE_DASHBOARD_ENABLED=yes
PARSE_DASHBOARD_PATH=/dashboard
PARSE_DASHBOARD_USER_ID=myuser
PARSE_DASHBOARD_USER_PASSWORD=mypassword
```

## Headless CMS

The API-first headless content management system, [chisel-cms](https://chiselcms.com), is included. However, it is disabled by default.

To enable the CMS, set the [environment variable](#environment-variables):

```
CMS_ENABLED=yes
```

It is then accessible at the root of the backend server (by default: https://localhost:1337)

Parse server users can then login by their user credentials. Users can be added using the [Parse SDK](http://parseplatform.org/Parse-SDK-JS/api), [REST API](https://docs.parseplatform.org/rest/guide/), [Graphql API](https://docs.parseplatform.org/graphql/guide/) or [Parse Dashboard](#parse-dashboard).

Alternatively, a user can be added by setting the environment variables:

```
CMS_USER_EMAIL=user@mywebsite.com
CMS_USER_PASSWORD=password
```

This creates a new user with these credentials in the parse server. If the user is already present, the password is reset to the supplied password.

## Automatic HTTPS

The frontend and backend are served by [Caddy server](https://caddyserver.com) with [automatic HTTPS](https://caddyserver.com/docs/automatic-https).

> Caddy serves all sites over HTTPS by default.
>
> - Caddy serves IP addresses and local/internal hostnames over HTTPS with locally-trusted certificates. Examples: localhost, 127.0.0.1.
> - Caddy serves public DNS names over HTTPS with certificates from [Let's Encrypt](https://letsencrypt.org/). Examples: example.com, sub.example.com, \*.example.com.
> - Caddy keeps all certificates renewed, and redirects HTTP (default port 80) to HTTPS (default port 443) automatically.
>
> from https://caddyserver.com/docs/automatic-https

## Frontend App

The frontend web app can use vanilla javascript or any javascript/typescript framework or library (see [Installing Dependencies](#installing-dependencies)). The app can interact with the backend using the [Parse JS SDK](http://parseplatform.org/Parse-SDK-JS/api), [REST API](https://docs.parseplatform.org/rest/guide/) or [Graphql API](https://docs.parseplatform.org/graphql/guide/).

A minimal vanilla javascript app is provided as a sample. It is a simple realtime todo app that uses the [Parse JS SDK](http://parseplatform.org/Parse-SDK-JS/api), [Bootstrap](https://getbootstrap.com/) and [Parcel bundler](https://parceljs.org/).

Feel free to edit/replace the app with your own.

## Local Development

### Running the Dev Server

With the environment variable `NODE_ENV` set to `development` (default), running `docker-compose up` starts the local development server on the front end with HMR. In addition, code in backend source directory is watched for changes which trigger backend server restart.

By default, the local development server runs on https://localhost:1234, mapping the port 1234 on the frontend container. The port can be configured by setting the environment variable `FRONTEND_DEV_SERVER_PORT`.

Hot Module Replacement (HMR) uses the port 1235. It can be configured using the environment variable `HMR_PORT`.

Example: if you have an angular CLI app, you may want to set the following environment variables:

```
FRONTEND_DEV_SERVER_PORT=4200
HMR_PORT=49153
```

### Production Build

When the environment variable `NODE_ENV` is set to `production`, `npm run build` is called in the frontend container to generate the production build in the folder `frontend/dist` (configurable by setting `FRONTEND_DIST_DIR` variable). The generated static files are served directly by caddy server.

To trigger frontend production build while in development mode, run:

```
docker-compose exec frontend npm run build
```

See [Running Shell Commands on Containers](#running-shell-commands-on-containers)

With `NODE_ENV=production`, the backend server process is managed by [PM2](https://pm2.keymetrics.io/) which restarts the server on crash.

### Running Shell Commands on Containers

Make sure the containers are running

```
docker-compose up -d
```

To start an interactive shell session on the frontend docker container run:

```
docker-compose exec frontend bash
```

and for the backend

```
docker-compose exec backend bash
```

### Installing Dependencies

Dependencies for the backend (including cloud code) are defined in [./backend/package.json](./backend/package.json). While dependencies for the frontend app are defined in [./frontend/package.json](./frontend/package.json).

Installing npm packages can be done like that:

```
docker-compose up -d
docker-compose exec frontend npm install lodash
docker-compose exec backend npm install lodash
```

Please note that adding dependencies have to be followed by docker image build to persist the changes in the docker images, by running:

```
docker-compose build
```

### NPM Scripts

For convenience, a [package.json](./package.json) file was added to the root of the repo, so that common commands can be saved as npm scripts for repeated tasks like starting the containers, starting shell sessions, running tests, ...etc.

Examples:

- ```
  npm start
  ```

  Runs the docker containers

- ```
  npm run docker-build
  ```

  Builds the docker images

- ```
  npm run frontend-shell
  ```

  starts intercative shell session in the frontend container

- ```
  npm run test
  ```

  runs tests on the frontend and backend containers

NPM needs to be installed on the host machine to be able to run npm scripts.

## Deployment

Docker and Docker Compose significantly simplify deployment. All the setup and dependencies are already taken care of in the docker images.

So, in principle, the steps required for deployment are:

- Defining the variables for the deployment environment.
- Building the docker images and verifying them.
- Running the containers on the host server.

Although this can be done manually, it is greatly simplified using the included automated CI/CD setup that uses github actions.

### Quick Start

Assuming you can connect using SSH to your server which has Docker and Docker Compose installed (see [Server Setup](#server-setup)), and that you have a personal github access token (see [Container Registry](#container-registry)), add the following [Github Secrets](#github-secrets):

- PROD_DOCKER_REGISTRY_TOKEN: your personal github access token

- PROD_SSH_HOST: your server IP address

- PROD_SSH_KEY: your server SSH private key
- PROD_ENV_VARS: edit the following example with your values

  ```
  HOST_NAME=mywebsite.com
  APP_ID=myappid
  MASTER_KEY=mymasterkey
  PARSE_DASHBOARD_USER_ID=user
  PARSE_DASHBOARD_USER_PASSWORD=pass
  ```

  Note: The environment variable `HOST_NAME` is required for remote deployment.

Now pushing code to main/master branch should trigger build and deploy to your server. Note that you can follow the progress and read logs of CI/CD workflows on the "Actions" tab in the gihub repo.

Continue reading for details.

### CI/CD using github actions

Pushing new code to the main branch (by default "main" or "master"), automatically triggers:

- collecting configurations as environment variables
- building docker images
- running tests
- pushing docker images to the container registry (by default, [Github Packages](https://github.com/features/packages))
- the production server pulls the built docker images and code
- docker-compose runs the containers on the deployment server

The same can be done for different deployment environments like staging (by default, the branch "staging") and development (by default, the branch "develop"). See [Multiple Deployment Environments](#multiple-deployment-environments).

Pull requests and code push to other branches trigger only building and testing the code.

Pushing docker images to the container registry requires setting Github Secret `{env}_DOCKER_REGISTRY_TOKEN` (e.g. `PROD_DOCKER_REGISTRY_TOKEN` for production builds). Deployment requires setting Github Secrets `{env}_SSH_HOST` and `{env}_SSH_KEY` (e.g. `PROD_SSH_HOST` and `PROD_SSH_KEY` for production deployments). See [Github Secrets](#github-secrets) for details.

Re-deploys can also be manually triggered (e.g. reverting to a previous build) by specifying the git SHA to revert to without having to re-build the images. See [Manual Re-Deploys](#manual-re-deploys)

Please note that github actions and github packages have limits for free accounts and are paid services. Check [github pricing](https://github.com/pricing) for details.

To limit usage of github packages storage in private repos, only the latest 10 versions of each docker image are kept, and older ones are deleted. This behaviour [can be configured](./.github/workflows/delete-old-images.yml). Packages for public repos are free and [cannot be deleted](https://docs.github.com/en/free-pro-team@latest/packages/publishing-and-managing-packages/deleting-a-package#about-public-package-deletion).

### Server Setup

Any cloud hosting service can be used for deployment. The server needs to have docker and docker-compose installed and you should be able to connect to it by SSH.

I prefer Digital Ocean for the simplicity and ease of use. You can get your server up and running with minimal setup in a few minutes for as low as $5/month. If you do not have an account, this is a [referral link](https://m.do.co/c/fb8c00b45b91) to get started with $100 in credit over 60 days. I recommend using the [Docker One-Click Droplet](https://cloud.digitalocean.com/marketplace/5ba19751fc53b8179c7a0071?refcode=fb8c00b45b91&i=89fa97) where you get docker and docker-compose pre-installed. Make sure to [add SSH key to the created droplet](https://www.digitalocean.com/docs/droplets/how-to/add-ssh-keys/).

[Configure the DNS records](https://www.digitalocean.com/community/tutorials/how-to-point-to-digitalocean-nameservers-from-common-domain-registrars#:~:text=DigitalOcean%20is%20not%20a%20domain,with%20Droplets%20and%20Load%20Balancers.), so that your [domain points to the deployment server](https://www.digitalocean.com/docs/networking/dns/how-to/manage-records/).

### Multiple Deployment Environments

The CI/CD setup allows deployment to one or more of the following environments: Production, Staging and Development.

The selection of environment is based on the git branch that triggered the deploy. Each environment has a prefix for the [Github Secrets](#github-secrets) used.

The following table summarizes the environments, the associated git branch and the prefix used for Github Secrets:

| Environment | Git branch   | Prefix | Example       |
| ----------- | ------------ | ------ | ------------- |
| Production  | main, master | PROD   | PROD_SSH_HOST |
| Staging     | staging      | STAG   | STAG_SSH_HOST |
| Development | develop      | DEV    | DEV_SSH_HOST  |

For example, pushing code to the git branch "develop" triggers "Development" build and deploy which use Github secrets prefixed by "DEV" (e.g. DEV_DOCKER_REGISTRY, DEV_DOCKER_REGISTRY_USER, DEV_DOCKER_REGISTRY_TOKEN, DEV_SSH_HOST, DEV_SSH_KEY, DEV_ENV_VARS). This causes pushing the docker images to the "Development" container registry and deploying the app to the "Development" server with the specified environment variables.

### Container Registry

By default, the included CI/CD setup uses [Github Packages](https://github.com/features/packages) as the container registry to host the built docker images, but it can be configured to use any other container registry.

A [github personal access token](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token) is required to allow for pushing to and pulling from the container registry. Note that the token needs to have permissions for `repo`, `write:packages` and `read:packages` (and `delete:packages` if you want to allow for automatic deletion of old images). This token should be saved as a value for the [Github Secret](#github-secrets): {env}\_DOCKER_REGISTRY_TOKEN (e.g. PROD_DOCKER_REGISTRY_TOKEN).

To use a different container registry (other than Github Packages), all the following Github Secrets have to be set:

- {env}\_DOCKER_REGISTRY
- {env}\_DOCKER_REGISTRY_USER
- {env}\_DOCKER_REGISTRY_TOKEN

For example, to use Docker Hub for production images set the following Github Secrets:

- PROD_DOCKER_REGISTRY: registry.hub.docker.com
- PROD_DOCKER_REGISTRY_USER: < your docker hub username >
- PROD_DOCKER_REGISTRY_TOKEN: < your docker hub password >

### Github Secrets

Deployment settings should be stored in [GitHub Secrets](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets).

For each deployment environment, the following set of secrets can be used (prefixed by the environment prefix - see [Multiple Deployment Environments](#multiple-deployment-environments) for details):

- **{env}\_DOCKER_REGISTRY**

  (e.g. PROD_DOCKER_REGISTRY)

  The docker container registry to host the built images.

  _default_: docker.pkg.github.com

- **{env}\_DOCKER_REGISTRY_USER**

  (e.g. PROD_DOCKER_REGISTRY_USER)

  Container registry username.

  _default_: github user.

- **{env}\_DOCKER_REGISTRY_TOKEN**

  (e.g. PROD_DOCKER_REGISTRY_TOKEN)

  Container registry password/token. When using Github Packages as registry, this should be the github personal access token ([see above](#container-registry)).

  _Required for pushing docker images._

- **{env}\_SSH_HOST**

  (e.g. PROD_SSH_HOST)

  Depolyment server address (used in SSH connection).

  _Required for deployment_

- **{env}\_SSH_PORT**

  (e.g. PROD_SSH_PORT)

  Depolyment server port (used in SSH connection).

  _default_: 22

- **{env}\_SSH_USER**

  (e.g. PROD_SSH_USER)

  User on deployment server (used in SSH connection)

  _default_: root

- **{env}\_SSH_KEY**

  (e.g. PROD_SSH_KEY)

  SSH key for deployment server (used in SSH connection)

  _Required for deployment_

- **{env}\_SSH_PATH**

  (e.g. PROD_SSH_PATH)

  Path on deployment server (used in SSH connection)

  _default_: ./deploy/

- **{env}\_ENV_VARS**

  (e.g. PROD_ENV_VARS)

  These are [environment variables](#environment-variables) that will be available when running `docker-compose up` on deployment server. Add each variable in a separate line.

  Example:

  ```
  HOST_NAME=mywebsite.com
  APP_ID=myappid
  MASTER_KEY=mymasterkey
  PARSE_DASHBOARD_USER_ID=user
  PARSE_DASHBOARD_USER_PASSWORD=pass
  ```

- **{env}\_DOCKER_COMPOSE_UP_ARGS**

  (e.g. PROD_DOCKER_COMPOSE_UP_ARGS)

  When running `docker-compose up` on deployment server the following arguments are passed

  ```
  --no-build -d
  ```

  You may add here more arguments.

  This can be used to run specific services (see [Using a Remote MongoDB Database](#using-a-remote-mongodb-database)), scaling, etc. See [documentations](https://docs.docker.com/compose/reference/up/) for details.

### Running Tests

During continuous integration, tests/checks are run by running `npm run ci-test` both on the frontend and backend containers. You may add all your tests/checks to this script.

### Manual Re-Deploys

You can manually trigger a previous deploy, without having to re-build or test it (e.g. you find a bug in the current build and you want to revert to a previous deploy).

The CI/CD workflow can be [triggered manually](https://github.blog/changelog/2020-07-06-github-actions-manual-triggers-with-workflow_dispatch/) (from ‘Run workflow’ button on the Actions tab)

You need to supply the git short SHA for the commit you want to revert to. This is the same as the tag used for the docker images. Make sure that the docker images with that tag are available (check <span>https</span>://github.com/{owner}/{repo}/packages).

When manual re-deploys are triggered, [Github Secrets](#github-secrets) used will be the ones present at the time of the new trigger not those that were present at the initial build.

### Using a Different Host Name for Backend (e.g. Subdomain)

By default, the backend server runs on the same host name provided (configured by `HOST_NAME` environment variable) on a separate port (by default, 1337).

For example by setting `HOST_NAME=mywebsite.com`, the backend is served on https://mywebsite.com:1337.

You may set the environment variable `BACKEND_HOST_NAME` to a seperate host name. By default the backend port becomes 443 (unless the variable `BACKEND_PORT` is set to a different port).

For example, to serve the backend on https://api.mywebsite.com, use this configuration:

```
HOST_NAME=mywebsite.com
BACKEND_HOST_NAME=api.mywebsite.com
```

Do not forget to configure the DNS records to point the backend host name to the same server.

Note that this can also be configured for localhost.

Example:

```
HOST_NAME=localhost
BACKEND_HOST_NAME=api.localhost
```

### Using a Remote MongoDB Database

To use a remote MongoDB instance (e.g. managed database on MongoDB Atlas) instead of the included container, follow the following steps:

- Set `PARSE_SERVER_DATABASE_URI` [environment variable](#environment-variables) to point to your database, for example:

  ```
  PARSE_SERVER_DATABASE_URI=mongodb+srv://<user>:<pass>@cluster0.abcde.mongodb.net/dev?retryWrites=true&w=majority
  ```

- Start the stack using the command:

  ```
  docker-compose up --no-deps backend frontend caddy
  ```

- To do the same for the CI/CD setup:
  - add the `PARSE_SERVER_DATABASE_URI` environment variable to `PROD_ENV_VARS` github secret.
  - add a github secret with the name `PROD_DOCKER_COMPOSE_UP_ARGS` and the value:
  ```
  --no-deps backend frontend caddy
  ```

## Contributing

Pull requests are welcome!

## License

[MIT](LICENSE.md)
