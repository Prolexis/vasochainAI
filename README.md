# VasoChain AI

[![GitHub stars](https://img.shields.io/github/stars/tu-usuario/vasochainAI?style=social)](https://github.com/tu-usuario/vasochainAI/stargazers)
[![GitHub license](https://img.shields.io/github/license/tu-usuario/vasochainAI)](https://github.com/tu-usuario/vasochainAI/blob/main/LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![GitHub release](https://img.shields.io/github/v/release/tu-usuario/vasochainAI)](https://github.com/tu-usuario/vasochainAI/releases)

## Resumen Ejecutivo

VasoChain AI es un sistema integral de supervisión y trazabilidad para el Programa Vaso de Leche, que combina **Inteligencia Artificial**, **Blockchain** y **WhatsApp** para garantizar transparencia, seguridad y autonomía en la gestión de entregas. El MVP funcional permite validar evidencias fotográficas mediante IA, registrar transacciones de manera inmutable en la blockchain y comunicarse con beneficiarios de forma conversacional a través de WhatsApp.

## Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                       │
│                    http://localhost:5174                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (NestJS)                         │
│                    http://localhost:3001                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Auth    │  │Beneficiar│  │ Entregas │  │  Controles│        │
│  │  Module  │  │   Module │  │  Module  │  │  Module  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Blockchain│  │    IA    │  │ WhatsApp │  │  Prisma  │        │
│  │  Module  │  │  Module  │  │  Module  │  │  (ORM)   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└───────┬───────────────┬───────────────┬────────────────────────┘
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌───────────┐ ┌─────────────────┐
│   PostgreSQL  │ │ Hardhat   │ │   Anthropic     │
│   (Docker)    │ │  Node     │ │   Claude API    │
│ localhost:5433│ │localhost:8545│                 │
└───────────────┘ └───────────┘ └─────────────────┘
```

## Funcionalidades Core

- **Gestión de Beneficiarios**: Registro, edición y eliminación de beneficiarios con generación automática de códigos QR
- **Simulador WhatsApp**: Pruebas sin dependencias externas
- **Validación de Evidencias con IA**: Análisis de fotografías mediante Claude con visión
- **Trazabilidad Blockchain**: Registro inmutable de entregas en un nodo Hardhat local
- **Panel de Control**: Dashboard interactivo con métricas y seguimiento en tiempo real
- **Gestión de Controles**: Sistema de controles y documentación para auditorías
- **WhatsApp Real (Opcional)**: Integración con Twilio WhatsApp Sandbox

## Stack Tecnológico

| Componente          | Tecnologías                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| **Frontend**        | React, Vite, TailwindCSS                                                    |
| **Backend**         | NestJS (TypeScript), Prisma ORM                                             |
| **Base de Datos**   | PostgreSQL                                                                   |
| **Blockchain**      | Hardhat, Solidity (Contrato `DeliveryRegistry.sol`)                         |
| **IA**              | Anthropic Claude (Visión)                                                    |
| **WhatsApp**        | Twilio WhatsApp Sandbox (Opcional), Simulador interno                       |
| **Contenerización** | Docker, Docker Compose                                                       |

## Requisitos Previos

- [Docker y Docker Compose](https://docs.docker.com/get-docker/)
- [Anthropic API Key](https://console.anthropic.com/) (para validación de evidencias)
- (Opcional) Cuenta de [Twilio](https://www.twilio.com/try-twilio) para WhatsApp real

## Instalación y Despliegue

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/vasochainAI.git
cd vasochainAI
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` y configura al menos:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Levantar el sistema

```bash
docker compose up --build
```

Esto construirá y levantará 4 contenedores en orden controlado:
1. `postgres`: Base de datos
2. `hardhat-node`: Nodo blockchain local (compila y despliega `DeliveryRegistry` automáticamente)
3. `backend`: API NestJS (espera a servicios dependientes y ejecuta migraciones)
4. `frontend`: Dashboard React

La primera vez puede tardar varios minutos.

### 4. Acceder a las interfaces

- **Dashboard**: [http://localhost:5174](http://localhost:5174)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **Hardhat Node**: [http://localhost:8545](http://localhost:8545)

## Uso Básico

### Plan A: Sin dependencias externas (Recomendado para Demo)

1. **Registrar Beneficiario**: Ve a la sección "Beneficiarios" y crea uno
2. **Simular Escaneo**: Ve al "Simulador WhatsApp" y selecciona el beneficiario
3. **Enviar Foto**: Adjunta una imagen (idealmente de comida/víveres)
4. **Ver Resultado**: Consulta el "Panel General" o "Entregas" para ver la entrega validada y registrada en la blockchain

### Plan B: Integración de Bots Reales (WhatsApp, Telegram y Discord)

Para probar la interacción directa desde tu teléfono celular utilizando cuentas y canales reales:

#### 1. Configurar Variables de Entorno (`.env`)
Añade las credenciales de las plataformas que desees probar en tu archivo `.env`:

* **WhatsApp (Whapi.Cloud):**
  * `WHAPI_TOKEN=tu_token_de_whapi_aqui`
  * `WHAPI_API_URL=https://gate.whapi.cloud`
* **Telegram Bot:**
  * `TELEGRAM_BOT_TOKEN=tu_token_de_telegram_bot_aqui` (Creado en [@BotFather](https://t.me/BotFather) usando `/newbot`).
* **Discord Bot:**
  * `DISCORD_BOT_TOKEN=tu_token_de_discord_bot_aqui` (Creado en el [Discord Developer Portal](https://discord.com/developers/applications)).
  * **Intents Requeridos:** En la pestaña **Bot** de tu aplicación en Discord, activa el interruptor **Message Content Intent** (bajo *Privileged Gateway Intents*) para que el bot pueda leer las fotos adjuntas en DMs.

#### 2. Reiniciar el Backend
Una vez guardadas las variables en tu `.env`, reinicia el backend de Docker para cargar los cambios:
```bash
docker compose restart backend
```

#### 3. Guía de Pruebas: Telegram Bot Real
1. Abre Telegram y busca tu bot. Escríbele cualquier mensaje o el comando `/start`.
2. El bot te responderá de forma automática indicándote tu **Telegram Chat ID** (un número de 9-10 dígitos, ej: `873629064`).
3. Abre el **Simulador Web** (`http://localhost:5174/simulador`), selecciona el canal **Telegram**, elige al beneficiario deseado, escribe tu Chat ID obtenido en la casilla **TELEGRAM CHAT ID** (Plan B) y haz clic en **Asociar Sesión Real**.
4. Recibirás un mensaje directo (DM) de bienvenida proactivo en tu Telegram.
5. Envía una foto de alimentos desde Telegram. El bot la procesará por el arnés de 13 controles, la registrará en la Blockchain y te responderá directamente en Telegram con el reporte formateado en HTML.

#### 4. Guía de Pruebas: Discord Bot Real
1. Invita a tu bot de Discord a tu servidor (genera la URL de invitación en **OAuth2 -> URL Generator** marcando el scope `bot` y los permisos `Send Messages`, `Attach Files` y `Read Message History`).
2. En Discord, ve a **Ajustes de Usuario -> Avanzado** y activa el **Modo Desarrollador**.
3. Haz clic derecho sobre tu foto de perfil en cualquier chat y selecciona **Copiar ID** para obtener tu **Discord User ID** (un identificador largo de 18 dígitos, ej: `987654321012345678`).
4. Abre el simulador en tu navegador, selecciona el canal **Discord**, ingresa tu ID en la casilla **DISCORD USER ID** (Plan B) y haz clic en **Asociar Sesión Real**.
5. Recibirás un mensaje directo (DM) de bienvenida en Discord.
6. Envía una foto de alimentos en el chat privado con tu bot. Recibirás el reporte de los 13 controles formateado en Markdown de Discord.

## Estructura del Proyecto

```
vasochainAI/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── auth/
│   │   ├── beneficiarios/
│   │   ├── blockchain/
│   │   ├── controles/
│   │   ├── entregas/
│   │   ├── harness/
│   │   ├── ia/
│   │   ├── prisma/
│   │   └── whatsapp/
│   ├── Dockerfile
│   └── package.json
├── blockchain/
│   ├── contracts/
│   │   └── DeliveryRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── Dockerfile
│   └── hardhat.config.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## Mantenimiento y Apagado

### Apagar sistema
```bash
docker compose down
```

### Eliminar datos persistentes
```bash
docker compose down -v
```

## Resolución de Problemas Comunes

| Problema                                  | Solución                                                                 |
|-------------------------------------------|--------------------------------------------------------------------------|
| Error "exec ./entrypoint.sh: no such file or directory" | Asegúrate de que los archivos `.sh` usen **LF** (no CRLF) como saltos de línea |
| Contenedor unhealthy                      | Ejecuta `docker compose logs <nombre-contenedor>` para ver registros     |
| No se conecta a la blockchain             | Verifica que el contenedor `hardhat-node` esté healthy                  |

## Contribuir

¡Las contribuciones son bienvenidas! Por favor:
1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la [Licencia MIT](https://opensource.org/licenses/MIT). Ver el archivo [LICENSE](LICENSE) para más detalles.

## Soporte y Contacto

- Para reportar bugs o solicitar features: [Issues](https://github.com/tu-usuario/vasochainAI/issues)
- Preguntas generales: Discusiones en [GitHub Discussions](https://github.com/tu-usuario/vasochainAI/discussions)
