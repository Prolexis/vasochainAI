const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Despliega DeliveryRegistry en el nodo Hardhat local y escribe la
 * dirección + ABI en /shared/contract.json, un volumen compartido con el
 * contenedor "backend" para que pueda conectarse al contrato sin pasos
 * manuales.
 */
async function main() {
  const DeliveryRegistry = await hre.ethers.getContractFactory(
    "DeliveryRegistry"
  );
  const contract = await DeliveryRegistry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`DeliveryRegistry desplegado en: ${address}`);

  const artifact = await hre.artifacts.readArtifact("DeliveryRegistry");

   const sharedDir = path.resolve(__dirname, "..", "..", "shared");
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }

  const output = {
    address,
    abi: artifact.abi,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(sharedDir, "contract.json"),
    JSON.stringify(output, null, 2)
  );

    console.log(`Direccion y ABI escritas en ${sharedDir}\\contract.json`);
}

main().catch((error) => {
  console.error("Error desplegando el contrato:", error);
  process.exitCode = 1;
});
