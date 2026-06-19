-- CreateEnum
CREATE TYPE "EstadoEntrega" AS ENUM ('PENDIENTE', 'VALIDADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "OrigenEntrega" AS ENUM ('simulado', 'whatsapp_real');

-- CreateTable
CREATE TABLE "beneficiarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "qr_code" TEXT NOT NULL,
    "club_madres" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beneficiarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entregas" (
    "id" TEXT NOT NULL,
    "beneficiario_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "foto_url" TEXT,
    "resultado_ia" JSONB,
    "hash_blockchain" TEXT,
    "tx_hash" TEXT,
    "estado" "EstadoEntrega" NOT NULL DEFAULT 'PENDIENTE',
    "origen" "OrigenEntrega" NOT NULL DEFAULT 'simulado',

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "entrega_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "beneficiarios_dni_key" ON "beneficiarios"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiarios_qr_code_key" ON "beneficiarios"("qr_code");

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_beneficiario_id_fkey" FOREIGN KEY ("beneficiario_id") REFERENCES "beneficiarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_entrega_id_fkey" FOREIGN KEY ("entrega_id") REFERENCES "entregas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
