CREATE TABLE "favoritos" (
    "usuario_id" INTEGER NOT NULL,
    "punto_interes_id" INTEGER NOT NULL,
    "agregado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("usuario_id", "punto_interes_id"),
    CONSTRAINT "favoritos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favoritos_punto_interes_id_fkey" FOREIGN KEY ("punto_interes_id") REFERENCES "puntos_interes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "favoritos_punto_interes_id_idx" ON "favoritos"("punto_interes_id");
