# Letsencrypt certs

To run the Application we need the first (initial) certificate to provide it to the container. 
After that, when the Application is already running, the certificate will be automatically renewed (see "Setup auto-renewal")

## Obtain first cert

```
cd letsencrypt
HOST_NAME=mydnsname.example.com ADMIN_EMAIL=admin@example.com ./get-first-cert.sh
```
(provide the real email as it will be used by letsencrypt to send notifications if auto-renewal wasn't successful)
Add the `DRY_RUN=true` var if running for test/debugging (certbot has rate limit of 5 prod certs/day in non-dry-run mode)

In case of the successful non-dry run - follow the commands provided in the terminal output under "Example commands to copy to nginx ssl dir"


## Setup auto-renewal

Setup the crontab job to renew the cert automatically every 2 months (cert is valid for 3 months)
```
sudo crontab -e
```
add line like this:
```
# replace PATH/TO parts (2 times):
0 6 2 */2 * (PATH=${PATH}:/usr/local/bin && cd /home/ec2-user/PATH/TO/nginx-docker/letsencrypt && HOST_NAME=mydnsname.example.com ./renew-ssl-cert.sh >> /home/ec2-user/PATH/TO/letsencrypt.log 2>&1)
```
(meaning this command will run at 6:00am UTC on the 2nd day of every 2 months)

