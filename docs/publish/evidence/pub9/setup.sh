#!/usr/bin/env bash
# How the disposable WordPress for the PUB9 probe was built (2026-09-30), on a throwaway cloud machine.
# No Docker: PHP 8.4's built-in server + the SQLite Database Integration plugin. Every password is
# generated at run time into 0600 files and never printed. Nothing here touches a real site.
set -euo pipefail
WORK="${WORK:-$PWD/pub9-work}"; mkdir -p "$WORK"; cd "$WORK"

curl -sSL -o wordpress.tar.gz https://wordpress.org/latest.tar.gz                      # measured: 7.1.2
curl -sSL -o sqlite.zip https://downloads.wordpress.org/plugin/sqlite-database-integration.latest-stable.zip  # 3.0.2
curl -sSL -o wp-cli.phar https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
tar xzf wordpress.tar.gz
(cd wordpress/wp-content/plugins && unzip -q ../../../sqlite.zip)
P="$WORK/wordpress/wp-content/plugins/sqlite-database-integration"
sed -e "s#{SQLITE_IMPLEMENTATION_FOLDER_PATH}#$P#" -e "s#{SQLITE_PLUGIN}#sqlite-database-integration/load.php#g" \
  "$P/db.copy" > wordpress/wp-content/db.php

WP="php $WORK/wp-cli.phar --allow-root --path=$WORK/wordpress"
$WP config create --dbname=probe --dbuser=probe --dbpass=probe --skip-check --force
# Then, by hand, above "That's all, stop editing!" in wp-config.php (probe only):
#   - if X-Forwarded-Proto is https, set $_SERVER['HTTPS']='on'  (TLS ends at the local front, proxies.mjs)
#   - WP_HOME / WP_SITEURL from the request's Host, so one install answers on http://wp.test:8080 and https://wp.test:8443
#   - WP_ENVIRONMENT_TYPE read from probe-env.txt ("production" for every case in the report)
echo production > wordpress/probe-env.txt

umask 077
openssl rand -hex 16 > .adminpw; openssl rand -hex 16 > .contribpw
$WP core install --url=http://127.0.0.1:8080 --title=Probe --admin_user=probe-admin \
  --admin_password="$(cat .adminpw)" --admin_email=probe-admin@example.invalid --skip-email
$WP user create probe-contributor probe-contributor@example.invalid --role=contributor --user_pass="$(cat .contribpw)"
$WP rewrite structure '/%postname%/'
$WP user application-password create probe-admin "Wrizo probe (admin)" --porcelain > .app-admin
$WP user application-password create probe-contributor "Wrizo probe (contributor)" --porcelain > .app-contrib

# Serve: php -S behind local TLS fronts; the probe browser maps *.test to 127.0.0.1.
cp router.php wordpress/probe-router.php   # router.php is in this folder
(cd wordpress && php -S 127.0.0.1:8080 probe-router.php) &
# self-signed cert for wp.test / wrizo.test, then: node proxies.mjs   (ports 8443, 8444, 5443)
# then: node pub9-probe.mjs ; node history-check.mjs ; node state-check.mjs
