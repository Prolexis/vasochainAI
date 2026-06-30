# Integración Blockchain Real — VasoChain AI (zkSYS Testnet)

## 1. Resumen ejecutivo

El proyecto registraba originalmente sus entregas en una blockchain **local y efímera** (un nodo Hardhat corriendo dentro de un contenedor Docker propio, red `chainId 31337`). Técnicamente generaba hashes y transacciones reales, pero esa red no era pública ni persistente: nadie fuera de la máquina del desarrollador podía verificarla, y se reiniciaba cada vez que se reconstruía el contenedor.

Se migró la integración para que el contrato `DeliveryRegistry` y todas las transacciones de registro de entregas ocurran en **zkSYS Testnet (zkTanenbaum)**, una red pública real, con explorador de bloques accesible por cualquier persona.

| | Antes | Ahora |
|---|---|---|
| Red | Hardhat local (`chainId 31337`) | zkSYS Testnet (zkTanenbaum), pública |
| RPC | `http://hardhat-node:8545` (interno, solo Docker) | `https://rpc-zk.tanenbaum.io` |
| Persistencia | Se borra al reiniciar el contenedor | Permanente |
| Verificación por terceros | Imposible (red privada) | Sí, vía `explorer-zk.tanenbaum.io` |
| Gas | Ficticio | Real (TSYS de testnet, gratis vía Faucet) |
| Wallet | Cuenta determinística de Hardhat (clave pública y conocida) | Wallet real generada en MetaMask |

No se modificó la lógica de negocio del contrato ni del pipeline de entregas — solo la configuración de red, las variables de entorno, y la forma de desplegar.

### Recursos oficiales usados

- Explorer: https://explorer-zk.tanenbaum.io/
- Faucet: https://faucet-zk.tanenbaum.io/
- RPC: `https://rpc-zk.tanenbaum.io`

### Evidencia de la integración funcionando

- Contrato `DeliveryRegistry` desplegado en: `0x98BeecF07E6D49f7dCDE50C2d0244FA33Ec411A5`
  → verificable en `https://explorer-zk.tanenbaum.io/address/0x98BeecF07E6D49f7dCDE50C2d0244FA33Ec411A5`
- Transacción de ejemplo (entrega real registrada): `0x2989d5037c3f121ad8430f68d5addb65e73b14c6199956bed9e032d8cb67f916`
  → verificable en `https://explorer-zk.tanenbaum.io/tx/0x2989d5037c3f121ad8430f68d5addb65e73b14c6199956bed9e032d8cb67f916`
  → estado `Success`, contrato verificado, evento `DeliveryRegistered` emitido con los datos de la entrega.

---

## 2. Qué cambió en el código

| Archivo | Cambio |
|---|---|
| `blockchain/hardhat.config.js` | Se agregó la red `zksys` (RPC + clave privada leídos desde `.env`), manteniendo `hardhat`/`localhost` para pruebas locales opcionales. |
| `blockchain/package.json` | Se agregó la dependencia `dotenv` y el script `deploy:zksys`. |
| `backend/src/blockchain/blockchain.service.ts` | Se eliminó el *fallback* hardcodeado a la clave privada de la cuenta de Hardhat (pública y conocida por cualquiera). Ahora exige `BLOCKCHAIN_PRIVATE_KEY` real en `.env`; si falta, deshabilita el módulo con un log claro en vez de firmar con una clave insegura. |
| `docker-compose.yml` | Se eliminó el servicio `hardhat-node` (ya no se necesita un nodo local persistente, la red zkSYS ya existe). El backend ahora lee `shared/contract.json` desde un bind mount de carpeta local. |
| `.env` / `.env.example` | `BLOCKCHAIN_RPC_URL` y `BLOCKCHAIN_PRIVATE_KEY` ahora apuntan a zkSYS Testnet real, no al nodo local. |

El contrato Solidity (`DeliveryRegistry.sol`), el script de despliegue (`deploy.js`) y la lógica de `entregas.service.ts` **no cambiaron** — la arquitectura ya estaba bien preparada para alternar de red.

---

## 3. Guía paso a paso para el equipo

Esta guía permite que cualquier miembro del equipo replique la integración desde cero. Hay un tramo común a todos (Pasos 1–4: wallet, faucet, despliegue del contrato) y luego dos caminos según cómo cada quien levante el proyecto (con o sin Docker).

### Paso 1 — Instalar MetaMask y crear la wallet del proyecto

1. Instala la extensión desde https://metamask.io/download/
2. Crea una wallet nueva siguiendo el asistente (guarda la frase de recuperación en un lugar seguro, fuera del repositorio).
3. Esta wallet es la que el backend usará para firmar transacciones — no se comparte con nadie ni se sube a git.

### Paso 2 — Agregar la red zkSYS a MetaMask

1. Abre https://faucet-zk.tanenbaum.io/
2. Baja hasta el botón **"Add zkSYS to Metamask"** y haz clic.
3. En el popup de MetaMask, haz clic en "Ver detalles" para confirmar Chain ID y RPC URL antes de aceptar, y luego confirma.
4. Verifica en MetaMask que ahora puedes seleccionar la red **"zkTanenbaum Testnet"** en el selector de redes.

### Paso 3 — Obtener tokens de prueba (gas gratis)

1. En MetaMask, cambia a la red "zkTanenbaum Testnet" y copia tu dirección pública (`0x...`).
2. En la página del Faucet (https://faucet-zk.tanenbaum.io/), selecciona la red "zkTanenbaum Testnet", token `TSYS`, pega tu dirección, y haz clic en **"REQUEST 5 TSYS"**.
3. Espera unos segundos y confirma en MetaMask que el saldo de TSYS llegó.

### Paso 4 — Exportar la clave privada (solo quien vaya a desplegar/correr el backend)

1. En MetaMask: ícono de tres puntos junto a tu cuenta → "Account details" → "Show private key" → ingresa tu contraseña de MetaMask.
2. Copia esa clave privada. **Nunca la compartas en chats, commits, ni capturas de pantalla** — cualquiera con esa clave puede gastar tus fondos de testnet y firmar transacciones en tu nombre.

> ⚠️ Si por error compartiste tu clave privada o tus API keys (Anthropic/OpenAI/Telegram/Discord) en un chat, grupo o repositorio público, considera esa credencial comprometida: genera una nueva desde la consola del proveedor correspondiente.

---

### Camino A — Levantar el proyecto CON Docker

1. Clona el repositorio y entra a la carpeta raíz del proyecto.
2. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edita `.env` y completa, como mínimo:
   ```
   BLOCKCHAIN_RPC_URL=https://rpc-zk.tanenbaum.io
   BLOCKCHAIN_PRIVATE_KEY=0x<tu_clave_privada_del_paso_4>
   ANTHROPIC_API_KEY=sk-ant-...   # o OPENAI_API_KEY=sk-proj-...
   ```
4. Crea también un `.env` dentro de `blockchain/` con las mismas dos variables de blockchain (Hardhat lee su propio `.env`):
   ```bash
   cd blockchain
   cat > .env << 'EOF'
   BLOCKCHAIN_RPC_URL=https://rpc-zk.tanenbaum.io
   BLOCKCHAIN_PRIVATE_KEY=0x<tu_clave_privada_del_paso_4>
   EOF
   ```
5. Instala dependencias y despliega el contrato (esto se hace **fuera** de Docker, una sola vez, porque ya no hay nodo Hardhat persistente en el compose):
   ```bash
   npm install
   npm run deploy:zksys
   ```
   Esto crea `../shared/contract.json` en la raíz del proyecto con la dirección y ABI del contrato recién desplegado.
6. Vuelve a la raíz del proyecto y levanta todo con Docker:
   ```bash
   cd ..
   docker compose up -d --build
   ```
7. Verifica en los logs del backend (`docker compose logs -f backend`) la línea:
   ```
   [BlockchainService] Conectado a DeliveryRegistry en 0x... (rpc: https://rpc-zk.tanenbaum.io)
   ```

---

### Camino B — Levantar el proyecto SIN Docker

1. Clona el repositorio y entra a la carpeta raíz.
2. Asegúrate de tener PostgreSQL instalado y corriendo localmente, con una base de datos creada (por ejemplo `vasochain`).
3. Crea `blockchain/.env`:
   ```
   BLOCKCHAIN_RPC_URL=https://rpc-zk.tanenbaum.io
   BLOCKCHAIN_PRIVATE_KEY=0x<tu_clave_privada_del_paso_4>
   ```
4. Despliega el contrato:
   ```bash
   cd blockchain
   npm install
   npm run deploy:zksys
   ```
   Esto genera `../shared/contract.json` en la raíz del proyecto.
5. Crea `backend/.env`:
   ```
   DATABASE_URL=postgresql://<usuario>:<password>@localhost:5432/vasochain
   BLOCKCHAIN_RPC_URL=https://rpc-zk.tanenbaum.io
   BLOCKCHAIN_PRIVATE_KEY=0x<tu_clave_privada_del_paso_4>
   CONTRACT_SHARED_PATH=../shared/contract.json
   ANTHROPIC_API_KEY=sk-ant-...   # o OPENAI_API_KEY=sk-proj-...
   TELEGRAM_BOT_TOKEN=...         # opcional
   DISCORD_BOT_TOKEN=...          # opcional
   ```
6. Instala dependencias y levanta el backend:
   ```bash
   cd ../backend
   npm install
   npx prisma migrate deploy
   npm run start:dev
   ```
7. Confirma en la consola la línea:
   ```
   [BlockchainService] Conectado a DeliveryRegistry en 0x... (rpc: https://rpc-zk.tanenbaum.io)
   ```
8. (Opcional) Levanta el frontend:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 4. Verificación de funcionamiento (ambos caminos)

1. Genera una entrega de prueba desde el frontend, el simulador de WhatsApp, o un bot (Telegram/Discord) configurado.
2. En la respuesta de la app, o en los logs del backend, busca el campo **`txHash`** (también visible en la tabla de la página "Entregas" del frontend).
3. Pega ese hash en:
   ```
   https://explorer-zk.tanenbaum.io/tx/<txHash>
   ```
4. Confirma que el explorer muestra:
   - **Status: Success**
   - **From:** tu dirección de wallet
   - **Interacted with contract:** la dirección de `DeliveryRegistry`
   - En la pestaña **Logs**: el evento `DeliveryRegistered` con `beneficiarioId`, `hashEvidencia` y `resultadoValidacion` decodificados.

Cualquier persona —incluido el docente— puede abrir ese link sin necesitar wallet, cuenta, ni acceso al servidor del equipo, y verificar de forma independiente que la transacción es real y pública.

---

## 5. Errores comunes y solución

| Síntoma | Causa | Solución |
|---|---|---|
| `Error: Cannot find module 'dotenv'` al correr Hardhat | Falta instalar la dependencia | `npm install dotenv --save-dev` dentro de `blockchain/` |
| `Error HH100: Network zksys doesn't exist` | El bloque `zksys` no está en `hardhat.config.js`, o se borró sin querer | Verificar que `networks.zksys` esté presente en el archivo (ver sección 2) |
| `invalid x-api-key` al validar con IA | La key en `ANTHROPIC_API_KEY` no es válida, o es de otro proveedor (las de Anthropic empiezan con `sk-ant-`, las de OpenAI con `sk-proj-`) | Generar key correcta en https://console.anthropic.com/settings/keys (o usar `OPENAI_API_KEY` si se prefiere GPT-4o) |
| Backend arranca pero `BlockchainService` no se conecta | Falta `BLOCKCHAIN_PRIVATE_KEY` en el `.env` que lee el backend, o la wallet no tiene saldo de TSYS | Verificar `.env`, y pedir más TSYS en el Faucet si la wallet quedó sin saldo |
| `contract.json` no existe / "Blockchain no disponible" | No se corrió `npm run deploy:zksys` antes de levantar el backend, o `CONTRACT_SHARED_PATH` apunta a una ruta incorrecta | Confirmar que `shared/contract.json` existe en la raíz del proyecto y que la ruta en `.env` es correcta según si usas Docker o no |

---

## 6. Buenas prácticas a mantener

- Nunca subir `.env` (ni de la raíz, ni de `backend/`, ni de `blockchain/`) al repositorio — todos deben estar en `.gitignore`.
- No reutilizar la wallet/clave privada de este proyecto académico para fondos reales o mainnet.
- Si una clave privada o API key se comparte por error (chat, captura de pantalla, commit), tratarla como comprometida y regenerarla de inmediato.
- Cada quien que despliegue su propia copia del contrato tendrá una dirección distinta — para que todo el equipo trabaje sobre el **mismo** contrato (y vea las mismas entregas), solo una persona debe desplegar, y el resto debe usar el mismo `shared/contract.json` (compartido por git o copiado manualmente), no volver a correr `deploy:zksys` cada uno por su cuenta.