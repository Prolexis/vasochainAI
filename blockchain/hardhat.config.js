require("@nomicfoundation/hardhat-toolbox");

/**
 * Configuración de Hardhat para VasoChain AI.
 * El nodo se levanta en 0.0.0.0:8545 dentro del contenedor para que
 * el servicio "backend" pueda conectarse vía la red interna de Docker.
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
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },
};
