
#!/usr/bin/env bash
set -e
set -x

echo 'Starting <dir>-ui...'

serve --single build
echo 'Done!'

tail -f /dev/null