FROM node:14.14.0-buster-slim

RUN apt-get update && apt-get install -y git

RUN mkdir /frontend

WORKDIR /frontend

COPY package*.json ./

RUN npm i

ADD . .

CMD [ "npm", "run", "start" ]
