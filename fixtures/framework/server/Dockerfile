FROM node:10-slim

RUN apt-get update && \
  apt-get install -y apt-transport-https && \
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
  apt-get update && \
  apt-get install -y yarn git lsof && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# backend specific steps:

HEALTHCHECK --interval=2s --timeout=1s --start-period=300s \
  CMD lsof -i -P -n | grep "LISTEN" | grep ":3030 " || \
  exit 1

RUN mkdir -p /usr/src/<dir>-server

COPY . /usr/src/<dir>-server/

WORKDIR /usr/src/<dir>-server

RUN yarn install && \
  yarn build

CMD [ "sh", "/usr/src/<dir>-server/docker-run.sh" ]