CREATE TYPE "EstadoEvento" AS ENUM ('BORRADOR', 'PUBLICADO', 'CANCELADO');
CREATE TYPE "EstadoReporte" AS ENUM ('PENDIENTE', 'EN_REVISION', 'RESUELTO', 'DESCARTADO');

ALTER TABLE "puntos_interes" ADD COLUMN "propietario_id" INTEGER;
CREATE INDEX "puntos_interes_propietario_id_estado_idx" ON "puntos_interes"("propietario_id", "estado");
ALTER TABLE "puntos_interes" ADD CONSTRAINT "puntos_interes_propietario_id_fkey" FOREIGN KEY ("propietario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "eventos" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "direccion" VARCHAR(250),
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "estado" "EstadoEvento" NOT NULL DEFAULT 'BORRADOR',
    "creador_id" INTEGER NOT NULL,
    "punto_interes_id" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "eventos_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "eventos_punto_interes_id_fkey" FOREIGN KEY ("punto_interes_id") REFERENCES "puntos_interes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "eventos_estado_fecha_inicio_fecha_fin_idx" ON "eventos"("estado", "fecha_inicio", "fecha_fin");
CREATE INDEX "eventos_punto_interes_id_idx" ON "eventos"("punto_interes_id");

CREATE TABLE "reportes" (
    "id" SERIAL NOT NULL,
    "motivo" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(500),
    "estado" "EstadoReporte" NOT NULL DEFAULT 'PENDIENTE',
    "usuario_id" INTEGER NOT NULL,
    "punto_interes_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reportes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reportes_punto_interes_id_fkey" FOREIGN KEY ("punto_interes_id") REFERENCES "puntos_interes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "reportes_estado_creado_en_idx" ON "reportes"("estado", "creado_en");
CREATE INDEX "reportes_punto_interes_id_idx" ON "reportes"("punto_interes_id");