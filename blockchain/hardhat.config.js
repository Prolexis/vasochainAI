require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * Configuración de Hardhat para VasoChain AI.
 *
 * Redes disponibles:
 * - hardhat/localhost: nodo local efímero, solo para pruebas rápidas.
 * - zksys: zkSYS Testnet (zkTanenbaum) pública y real. Explorer:
 *   https://explorer-zk.tanenbaum.io · Faucet: https://faucet-zk.tanenbaum.io
 */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    zksys: {
      url: process.env.BLOCKCHAIN_RPC_URL || "https://rpc-zk.tanenbaum.io",
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY
        ? [process.env.BLOCKCHAIN_PRIVATE_KEY]
        : [],
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },
};