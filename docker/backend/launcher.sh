#!/bin/bash

# DB
while ! nc -z mariadb_database 3306; do
  echo 'Waiting for database startup…'
  sleep 1
done

set -e

# Preparation
if [ ! -f /backend/.env ]; then
  cp /backend/.env.example /backend/.env
fi

cd /backend

mkdir -p \
  /backend/bootstrap/cache \
  /backend/storage/framework/cache \
  /backend/storage/framework/sessions \
  /backend/storage/framework/views

chown -R www-data:www-data \
  /backend/bootstrap/cache \
  /backend/storage/framework/cache \
  /backend/storage/framework/sessions \
  /backend/storage/framework/views

if [ ! -f /backend/vendor/autoload.php ]; then
  composer install
fi

php artisan migrate:fresh --seed --force

# Run
exec supervisord -c /etc/supervisor/supervisord.conf
