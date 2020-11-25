FROM parseplatform/parse-dashboard:latest as builder

USER root

RUN apk update && apk upgrade && \
    apk add --no-cache git

RUN mkdir -p /src/parse-server

WORKDIR /src/parse-server

COPY package*.json ./

RUN npm i

FROM node:14.14.0-buster-slim

COPY --from=builder /src /src

WORKDIR /src/parse-server

ADD . .

CMD [ "npm", "run", "start" ]
