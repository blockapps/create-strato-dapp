FROM node:10-slim

RUN apt-get update && \
  apt-get install -y apt-transport-https && \
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
  apt-get update && \
  apt-get install -y yarn git lsof && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# ui specific steps:

HEALTHCHECK --interval=2s --timeout=1s --start-period=300s \
  CMD lsof -i -P -n  | grep "LISTEN" | grep ":5000 " || \
  exit 1

RUN mkdir -p /usr/src/<dir>-ui

COPY . /usr/src/<dir>-ui/

WORKDIR /usr/src/<dir>-ui/

RUN yarn install && \
  yarn global add serve && \
  yarn build && \
  rm -rf node_modules

CMD [ "sh", "/usr/src/<dir>-ui/docker-run.sh" ]