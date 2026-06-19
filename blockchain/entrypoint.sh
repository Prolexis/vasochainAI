#!/bin/sh
set -e

if [ -d "/app/artifacts/contracts" ]; then
  echo "Contratos ya compilados (artifacts presentes). Saltando compilacion..."
else
  echo "Compilando contratos..."
  npx hardhat compile
fi

echo "Levantando nodo Hardhat en background..."
npx hardhat node --hostname 0.0.0.0 &
NODE_PID=$!

echo "Esperando a que el nodo Hardhat responda en :8545..."
until curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://127.0.0.1:8545 | grep -q "200"; do
  sleep 1
done

echo "Nodo Hardhat listo. Desplegando contrato DeliveryRegistry..."
npx hardhat run scripts/deploy.js --network localhost

echo "Contrato desplegado. Manteniendo el nodo Hardhat en foreground..."
wait $NODE_PID
