#!/bin/sh
set -e

echo "Aplicando migraciones de base de datos..."
npx prisma migrate deploy

echo "Iniciando backend VasoChain AI..."
node dist/src/main.js
