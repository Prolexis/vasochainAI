FROM node:20-alpine

WORKDIR /app

# curl es necesario para el healthcheck del entrypoint
RUN apk add --no-cache curl

COPY package.json ./
RUN npm install

COPY . .

# Pre-compilamos los contratos durante el build para cachear el
# compilador de Solidity en la imagen. Asi el entrypoint no necesita
# internet para descargarlo cada vez que arranca.
RUN npx hardhat compile

RUN sed -i -e '1s/^\xef\xbb\xbf//' -e 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 8545

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
