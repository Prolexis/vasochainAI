import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

interface ContratoDesplegado {
  address: string;
  abi: ethers.InterfaceAbi;
  deployedAt: string;
}

/**
 * Cliente de blockchain. Se conecta al nodo Hardhat local vía RPC y al
 * smart contract DeliveryRegistry usando la dirección/ABI que el servicio
 * "blockchain" (contenedor Hardhat) escribe en /shared/contract.json al
 * desplegar.
 *
 * Si el contrato todavía no fue desplegado (el contenedor de blockchain
 * está iniciando), reintenta la conexión en segundo plano sin tumbar el
 * resto del backend.
 */
@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private readonly contractSharedPath: string;
  private readonly rpcUrl: string;
  private readonly privateKey: string;

  constructor(private readonly config: ConfigService) {
    this.contractSharedPath =
      this.config.get<string>('CONTRACT_SHARED_PATH') ||
      '/shared/contract.json';
    this.rpcUrl =
      this.config.get<string>('BLOCKCHAIN_RPC_URL') ||
      'http://hardhat-node:8545';
    // Cuenta #0 por defecto que Hardhat node imprime al iniciar (determinística
    // en su red local de desarrollo). Se puede sobreescribir vía .env.
    this.privateKey =
      this.config.get<string>('BLOCKCHAIN_PRIVATE_KEY') ||
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  }

  async onModuleInit() {
    // No se usa "await" a propósito: si la blockchain todavía no está
    // lista (el contenedor "blockchain" sigue compilando/desplegando),
    // no debe bloquear el arranque del resto de la API. La conexión se
    // reintenta en segundo plano y estaDisponible() refleja el estado
    // real en cada momento.
    this.intentarConectar().catch((error) => {
      this.logger.error(`Fallo irrecuperable conectando a blockchain: ${error.message}`);
    });
  }

  /**
   * Intenta cargar contract.json y conectarse. Si falla, reintenta cada
   * 3s hasta 40 veces (~2 minutos), tiempo suficiente para que el
   * contenedor de Hardhat compile, levante el nodo y despliegue el
   * contrato. No bloquea el arranque del resto del backend.
   */
  private async intentarConectar(intentos = 40) {
    for (let i = 0; i < intentos; i++) {
      try {
        if (fs.existsSync(this.contractSharedPath)) {
          const raw = fs.readFileSync(this.contractSharedPath, 'utf-8');
          const data: ContratoDesplegado = JSON.parse(raw);

          this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
          this.wallet = new ethers.Wallet(this.privateKey, this.provider);
          this.contract = new ethers.Contract(
            data.address,
            data.abi,
            this.wallet,
          );

          // Verifica que el nodo realmente responda antes de declarar éxito.
          await this.provider.getBlockNumber();

          this.logger.log(
            `Conectado a DeliveryRegistry en ${data.address} (rpc: ${this.rpcUrl})`,
          );
          return;
        }
      } catch (error) {
        this.logger.warn(
          `Intento ${i + 1}/${intentos}: nodo/contrato blockchain aún no disponible (${error.message})`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    this.logger.error(
      'No se pudo conectar a la blockchain tras varios intentos. El registro on-chain estará deshabilitado hasta que el servicio "blockchain" esté disponible.',
    );
  }

  estaDisponible(): boolean {
    return this.contract !== null;
  }

  /**
   * Registra una entrega en el smart contract DeliveryRegistry.
   * @throws Error si la blockchain no está disponible todavía.
   */
  async registrarEntrega(
    beneficiarioId: string,
    hashEvidencia: string,
    resultadoValidacion: boolean,
  ): Promise<{ txHash: string; onChainId: string }> {
    if (!this.contract) {
      throw new Error(
        'Blockchain no disponible: el nodo/contrato aún no está conectado.',
      );
    }

    const tx = await this.contract.registrarEntrega(
      beneficiarioId,
      hashEvidencia,
      resultadoValidacion,
    );
    const receipt = await tx.wait();

    // Extrae el id asignado on-chain desde el evento DeliveryRegistered.
    let onChainId = '0';
    for (const log of receipt.logs) {
      try {
        const parsed = this.contract.interface.parseLog(log);
        if (parsed?.name === 'DeliveryRegistered') {
          onChainId = parsed.args.id.toString();
          break;
        }
      } catch {
        // log de otro contrato/evento, se ignora
      }
    }

    return { txHash: receipt.hash, onChainId };
  }

  async obtenerEntregasPorBeneficiario(
    beneficiarioId: string,
  ): Promise<string[]> {
    if (!this.contract) {
      throw new Error('Blockchain no disponible.');
    }
    const ids =
      await this.contract.obtenerEntregasPorBeneficiario(beneficiarioId);
    return ids.map((id: bigint) => id.toString());
  }
}
