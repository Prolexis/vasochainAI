FROM node:20-alpine

WORKDIR /app

# openssl es requerido por el engine de Prisma en Alpine
# wget se usa en el healthcheck de docker-compose
RUN apk add --no-cache openssl curl wget

COPY package.json package-lock.json* ./
RUN npm install --production=false

COPY . .

# Generar el cliente de Prisma y compilar NestJS en build time (no en
# cada arranque del contenedor). prisma generate solo necesita el schema,
# no la conexión a la base de datos, así que es seguro hacerlo aquí.
RUN npx prisma generate
RUN npm run build

RUN sed -i -e '1s/^\xef\xbb\xbf//' -e 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
