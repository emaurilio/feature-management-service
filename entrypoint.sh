#!/bin/sh

echo "Aguardando o MySQL em $DB_HOST:$DB_PORT..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done

echo "MySQL pronto! Rodando migrations..."
npm run migration:run

echo "Iniciando a aplicação..."
npm run start:dev