#!/bin/sh
set -e

echo "Aplicando esquema de base de datos y migraciones..."
npx prisma db push

echo "Ejecutando seed de datos iniciales..."
npx prisma db seed || true

echo "Iniciando backend VasoChain AI..."
node dist/src/main.js

