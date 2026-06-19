-- CreateEnum
CREATE TYPE "ControlStatus" AS ENUM ('BORRADOR', 'VALIDADO', 'APROBADO', 'EN_PRUEBAS', 'PRODUCCION', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('PENDIENTE', 'EN_EJECUCION', 'APROBADO', 'FALLIDO');

-- CreateTable
CREATE TABLE "categorias_controles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_controles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controles" (
    "id" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "dependencias" JSONB,
    "requerimientos_acceso" JSONB,
    "objetivos_alineados" JSONB,
    "estado" "ControlStatus" NOT NULL DEFAULT 'BORRADOR',
    "es_frecuente" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controles_descartados" (
    "id" TEXT NOT NULL,
    "control_id" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "motivo_eliminacion" TEXT NOT NULL,
    "criterios_aplicados" JSONB,
    "responsable" TEXT NOT NULL,
    "fecha_eliminacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "controles_descartados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_pruebas" (
    "id" TEXT NOT NULL,
    "control_id" TEXT NOT NULL,
    "tipo_prueba" TEXT NOT NULL,
    "estado" "TestStatus" NOT NULL DEFAULT 'PENDIENTE',
    "resultado" JSONB,
    "mensaje" TEXT,
    "ejecutado_por" TEXT,
    "fecha_ejecucion" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resultados_pruebas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentacion" (
    "id" TEXT NOT NULL,
    "control_id" TEXT,
    "tipo_documento" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "creado_por" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_controles_nombre_key" ON "categorias_controles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "controles_identificador_key" ON "controles"("identificador");

-- CreateIndex
CREATE UNIQUE INDEX "controles_descartados_control_id_key" ON "controles_descartados"("control_id");

-- AddForeignKey
ALTER TABLE "controles" ADD CONSTRAINT "controles_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_controles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_pruebas" ADD CONSTRAINT "resultados_pruebas_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "controles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentacion" ADD CONSTRAINT "documentacion_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "controles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
