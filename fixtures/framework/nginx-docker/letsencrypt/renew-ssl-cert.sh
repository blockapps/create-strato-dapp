#!/bin/bash
set -e

if [ -z "${HOST_NAME}" ]; then 
  echo "HOST_NAME var is not provided. Please enter the server hostname (e.g. example.com):"
  read -r HOST_NAME
fi

if [[ "${DRY_RUN}" = "true" ]]; then
  echo "DRY_RUN is set to true - will do the dry run (staging) - for test or debugging."
  DRY_RUN_STRING="--dry-run"
else
  echo "DRY_RUN is NOT set to true - will execute the PRODUCTION cert request (rate limit of 5 certs/day)"
  DRY_RUN_STRING=""
fi

# Stop nginx using port 80
docker stop nginx-docker_nginx_1

# Start letsencrypt nginx
docker-compose up -d

function cleanup {
  docker-compose down
  docker start nginx-docker_nginx_1
}

trap cleanup EXIT

# Renew
docker run -i --rm \
  -v $(pwd)/letsencrypt-site:/data/letsencrypt \
  -v $(pwd)/letsencrypt-data/etc/letsencrypt:/etc/letsencrypt \
  -v $(pwd)/letsencrypt-data/var/lib/letsencrypt:/var/lib/letsencrypt \
  -v $(pwd)/letsencrypt-data/var/log/letsencrypt:/var/log/letsencrypt \
  certbot/certbot \
  renew ${DRY_RUN_STRING} --force-renewal

# Copy the new certs
cp $(pwd)/letsencrypt-data/etc/letsencrypt/live/${HOST_NAME}/fullchain.pem ../ssl/server.pem
cp $(pwd)/letsencrypt-data/etc/letsencrypt/live/${HOST_NAME}/privkey.pem ../ssl/server.key

printf "\nDone.\n\n"

if [[ "${DRY_RUN}" = "true" ]]; then
  echo "See above for a dry-run result. To actually renew the cert - execute the normal run."
  printf "\n\n"
else
  echo "Certs have been renewed. See output above."
  printf "\n\n"
fi
