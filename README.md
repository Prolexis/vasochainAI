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

### Plan B: WhatsApp Real con Whapi.Cloud

#### 1. Configurar Whapi.Cloud
- Añade `WHAPI_TOKEN` y `WHAPI_API_URL` a tu `.env`

#### 2. Exponer backend con Cloudflare Tunnel
El túnel se levanta automáticamente con Docker Compose. Para obtener tu URL pública autogenerada, ejecuta:
```bash
docker compose logs tunnel
```

#### 3. Configurar Webhook en Whapi.Cloud
- En tu panel de Whapi.Cloud, configura tu webhook apuntando a:
  `https://TU-URL-DE-TUNNEL.trycloudflare.com/whatsapp/webhook`

#### 4. Asociar número
Realiza una solicitud `POST /whatsapp/iniciar-sesion` con:
```json
{
  "numeroWhatsapp": "51999999999",
  "beneficiarioId": "ID_DEL_BENEFICIARIO"
}
```

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
