# Guía paso a paso: Despliegue en zkSYS Testnet (con Docker)

Esta guía describe el orden exacto para configurar tu wallet real, obtener saldo del Faucet, configurar el archivo de variables de entorno y redesplegar el contrato inteligente en la red de pruebas pública **zkSYS Testnet (zkTanenbaum)** utilizando tu entorno de desarrollo basado en Docker.

---

## Parte 1 — Crear la wallet nueva en MetaMask

1. Abre MetaMask en tu navegador.
2. Haz clic en el ícono de tu cuenta (el círculo de colores arriba a la derecha).
3. Selecciona *"Add account or hardware wallet"* (Añadir cuenta).
4. Elige *"Add a new account"* (Añadir cuenta nueva).
5. Ponle un nombre descriptivo, por ejemplo: `VasoChain Proyecto`.
6. Haz clic en *"Create"*.

Ya tienes una cuenta nueva, separada de tu cuenta personal. Copia la dirección pública que empieza con `0x...` que aparece arriba (esta es tu **Wallet / Address del proyecto**).

---

## Parte 2 — Agregar la red zkSYS (zkTanenbaum)

MetaMask comparte las redes entre todas las cuentas. Si ya agregaste zkTanenbaum Testnet antes, ya la verás disponible en el selector de redes. Si no aparece, puedes agregarla automáticamente de la siguiente forma:

1. Ve a [https://faucet-zk.tanenbaum.io/](https://faucet-zk.tanenbaum.io/).
2. Haz clic en el botón **"Add zkSYS to Metamask"** (ubicado al final de la página).
3. Confirma y aprueba la solicitud en la ventana emergente de MetaMask.

---

## Parte 3 — Pedir tokens al Faucet

1. En MetaMask, asegúrate de estar en la cuenta **VasoChain Proyecto** y de haber seleccionado la red **zkTanenbaum Testnet**.
2. Copia tu dirección pública `0x...`.
3. Ve a [https://faucet-zk.tanenbaum.io/](https://faucet-zk.tanenbaum.io/).
4. Pega la dirección en el campo *"Destination zkSYS Wallet Address"*.
5. Haz clic en *"REQUEST 5 TSYS"*.
6. Espera la confirmación — verás el saldo llegar a MetaMask en unos segundos.

---

## Parte 4 — Exportar la clave privada de la cuenta nueva

1. En MetaMask, estando en la cuenta **VasoChain Proyecto**.
2. Haz clic en los *tres puntos (⋮)* junto al nombre de la cuenta.
3. Selecciona *"Account details"* (Detalles de la cuenta).
4. Haz clic en *"Show private key"* (Mostrar clave privada).
5. Ingresa tu contraseña de MetaMask para desbloquearla.
6. Copia la clave privada de 64 caracteres hexadecimales que aparece (empieza con `0x...`).

*Guárdala en un lugar seguro. No la compartas en chats ni capturas de pantalla.*

---

## Parte 5 — Actualizar tu archivo `.env` en la raíz

Abre el archivo `.env` que se encuentra en la raíz de tu proyecto (`vasochainAI/.env`) y edita las variables de blockchain con tus datos reales:

```env
# --- Blockchain (zkSYS Testnet) ---
BLOCKCHAIN_RPC_URL=https://rpc-zk.tanenbaum.io
BLOCKCHAIN_PRIVATE_KEY=0x<tu_nueva_clave_privada_copiada_de_metamask>
CONTRACT_SHARED_PATH=/shared/contract.json
```

---

## Parte 6 — Redesplegar el contrato con la wallet nueva

Dado que los contenedores utilizan una carpeta compartida física (`./shared`), puedes compilar y desplegar el contrato directamente desde tu terminal local de la siguiente forma:

```bash
# 1. Entra a la carpeta de blockchain
cd blockchain

# 2. Instala dependencias si no lo has hecho
npm install

# 3. Ejecuta el script de despliegue apuntando a la red zksys
npx hardhat run scripts/deploy.js --network zksys
```

Cuando termine, la consola imprimirá algo como:
```text
DeliveryRegistry desplegado en: 0xNUEVA_DIRECCION_CONTRATO
Direccion y ABI escritas en ...\shared\contract.json
```

Copia esa nueva dirección — esa es la que entregas a tus revisores como **"Address del Smart Contract"**.

---

## Parte 7 — Reiniciar Docker y verificar que todo funciona

1. Regresa a la raíz de tu proyecto y reinicia tus contenedores de Docker:
   ```bash
   cd ..
   docker compose down
   docker compose up -d
   ```

2. Verifica en los logs del backend que se conecte correctamente al nuevo contrato:
   ```bash
   docker compose logs -f backend
   ```
   Debes ver una línea indicando éxito:
   `[BlockchainService] Conectado a DeliveryRegistry en 0xNUEVA_DIRECCION_CONTRATO (rpc: https://rpc-zk.tanenbaum.io)`

3. Haz una entrega de prueba desde el simulador de la web.
4. Toma el `txHash` de la entrega (visible en la tabla de la sección "Entregas") y búscalo en el explorador oficial:
   `https://explorer-zk.tanenbaum.io/tx/<txHash>`
   Confirma que el campo *"From"* coincida con la dirección pública de tu nueva wallet de MetaMask.

---

## Lo que entregas a tus revisores (tras completar todo)

| Campo en el Formulario | Valor |
|---|---|
| **Address del proyecto en Syscoin NEVM Mainnet** | Tu dirección pública `0x...` de la wallet (MetaMask) que creaste en el Paso 1. |
| **Address del Smart Contract en zkSYS Testnet** | La dirección `0x...` que imprimió la consola en el Paso 6 al redesplegar. |
