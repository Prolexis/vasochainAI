# VasoChain AI

MVP funcional: supervisión y trazabilidad del Programa Vaso de Leche mediante IA, Blockchain, códigos QR y un agente conversacional de WhatsApp.

## Stack

- **Backend**: NestJS (TypeScript) + Prisma ORM
- **Base de datos**: PostgreSQL
- **Blockchain**: nodo Hardhat local (Ethereum) + smart contract `DeliveryRegistry.sol`
- **IA**: Claude (visión) para validar evidencias fotográficas
- **WhatsApp**: Twilio WhatsApp Sandbox (Plan B, opcional) + simulador interno (Plan A, principal)
- **Frontend**: React + Vite + TailwindCSS

## Requisitos previos

- Docker y Docker Compose instalados.
- Una API key de Anthropic (Claude) para que la validación de evidencias funcione. Sin ella, todo el sistema arranca igual, pero las entregas quedarán marcadas como "no validadas" hasta que la configures.

## 1. Configurar variables de entorno

```bash
cp .env.example .env
```

Abre `.env` y completa al menos:

```
ANTHROPIC_API_KEY=sk-ant-...
```

El resto de variables ya tiene valores por defecto que funcionan para desarrollo local. Las credenciales de Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`) son opcionales — solo se necesitan para el Plan B (ver sección al final).

## 2. Levantar todo el sistema

```bash
docker compose up --build
```

Esto construye y levanta 4 contenedores en orden controlado:

1. `postgres` — base de datos.
2. `hardhat-node` — nodo blockchain local; compila y despliega automáticamente el contrato `DeliveryRegistry` al iniciar.
3. `backend` — espera a que postgres y la blockchain estén saludables, corre las migraciones de Prisma y levanta la API en `http://localhost:3000`.
4. `frontend` — dashboard en `http://localhost:5173`.

La primera vez puede tardar unos minutos (descarga de imágenes, compilación de contratos, instalación de dependencias). Las siguientes veces será mucho más rápido gracias al cache de Docker.

Cuando todo esté arriba, abre **http://localhost:5173**.

## 3. Probar el flujo completo (Plan A — sin nada externo)

Este es el camino recomendado para la demo, porque no depende de Twilio, ngrok ni de conexión a internet del lugar:

1. En el dashboard, ve a **Beneficiarios** y registra uno (nombre, DNI, club de madres, sector). Esto genera automáticamente su código QR.
2. Ve a **Simulador WhatsApp**.
3. Selecciona el beneficiario y haz clic en "Simular escaneo de QR" — esto abre la conversación simulada.
4. Adjunta una foto cualquiera (idealmente de comida, víveres, o una entrega) y envíala.
5. El sistema: valida la foto con IA → registra el resultado en la blockchain local → lo persiste en PostgreSQL.
6. Ve a **Panel general** o **Entregas** para ver el resultado en tiempo real, incluyendo el hash de la transacción on-chain.

## 4. (Opcional) Activar el Plan B: WhatsApp real con Twilio

Si quieres que alguien pueda escribirle de verdad al número de WhatsApp Sandbox desde su celular:

### a) Crear cuenta y activar el Sandbox de Twilio

1. Crea una cuenta gratuita en [twilio.com](https://www.twilio.com/try-twilio).
2. En la consola, ve a **Messaging → Try it out → Send a WhatsApp message** para activar el WhatsApp Sandbox.
3. Sigue las instrucciones para vincular tu número de WhatsApp personal al sandbox (vas a enviar un mensaje tipo "join nombre-clave" al número que te indiquen).
4. Copia el **Account SID** y el **Auth Token** desde el dashboard principal de Twilio y pégalos en tu `.env`:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### b) Exponer tu backend local con ngrok

Twilio necesita poder enviarle peticiones a tu backend, que corre en tu máquina local. Para eso usamos ngrok como túnel temporal:

1. Instala ngrok: [https://ngrok.com/download](https://ngrok.com/download) (o `brew install ngrok` en Mac, o descarga el binario para Windows/Linux).
2. Crea una cuenta gratuita en ngrok y autentica tu CLI siguiendo las instrucciones de su dashboard (comando `ngrok config add-authtoken ...`).
3. Con el backend ya corriendo (`docker compose up`), en otra terminal ejecuta:

```bash
ngrok http 3000
```

4. ngrok te dará una URL pública, algo como `https://a1b2c3d4.ngrok-free.app`. Cópiala.

### c) Configurar el webhook en Twilio

1. Vuelve a la consola de Twilio, en la configuración del WhatsApp Sandbox.
2. En el campo **"When a message comes in"**, pega tu URL de ngrok seguida de `/whatsapp/webhook`:

```
https://a1b2c3d4.ngrok-free.app/whatsapp/webhook
```

3. Guarda los cambios.

### d) Probarlo

1. Asocia tu número de WhatsApp con un beneficiarioId llamando al endpoint `POST /whatsapp/iniciar-sesion` con `{ "numeroWhatsapp": "whatsapp:+51999999999", "beneficiarioId": "..." }` (puedes hacerlo con curl o Postman).
2. Envía una foto al número de WhatsApp Sandbox desde tu celular.
3. El backend recibirá el webhook, descargará la imagen, y disparará el mismo pipeline interno que usa el Plan A (validación IA → blockchain → dashboard).

**Nota:** cada vez que reinicies ngrok sin un dominio fijo, la URL pública cambia y tendrás que actualizarla en la configuración del Sandbox de Twilio.

## Apagar el sistema

```bash
docker compose down
```

Para borrar también los datos persistidos (base de datos, contrato desplegado, fotos subidas):

```bash
docker compose down -v
```

## Estructura del proyecto

```
vasochain-ai/
├── backend/        # API NestJS + Prisma + integraciones (IA, blockchain, WhatsApp)
├── blockchain/      # Contratos Solidity + nodo Hardhat local
├── frontend/        # Dashboard React + Vite + Tailwind
├── docker-compose.yml
└── .env.example
```
