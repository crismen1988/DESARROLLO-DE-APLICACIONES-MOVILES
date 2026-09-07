CREATE TYPE "TipoCuenta" AS ENUM ('TURISTA', 'PRESTADOR_TURISTICO');
CREATE TYPE "EstadoVerificacion" AS ENUM ('NO_APLICA', 'PENDIENTE', 'APROBADO', 'RECHAZADO');

ALTER TABLE "usuarios"
  ADD COLUMN "tipo_cuenta" "TipoCuenta" NOT NULL DEFAULT 'TURISTA',
  ADD COLUMN "ruc" VARCHAR(13),
  ADD COLUMN "estado_verificacion" "EstadoVerificacion" NOT NULL DEFAULT 'NO_APLICA',
  ADD COLUMN "verificado_en" TIMESTAMP(3),
  ADD COLUMN "motivo_rechazo" VARCHAR(500);

CREATE UNIQUE INDEX "usuarios_ruc_key" ON "usuarios"("ruc");

UPDATE "usuarios"
SET
  "tipo_cuenta" = 'PRESTADOR_TURISTICO',
  "estado_verificacion" = CASE
    WHEN "proveedor_verificado" THEN 'APROBADO'::"EstadoVerificacion"
    ELSE 'PENDIENTE'::"EstadoVerificacion"
  END
WHERE "rol" = 'PROVEEDOR';