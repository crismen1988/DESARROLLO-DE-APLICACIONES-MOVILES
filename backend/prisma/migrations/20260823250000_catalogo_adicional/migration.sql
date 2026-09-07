CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

CREATE TABLE "horarios_puntos_interes" (
    "id" SERIAL NOT NULL,
    "punto_interes_id" INTEGER NOT NULL,
    "dia" "DiaSemana" NOT NULL,
    "apertura" VARCHAR(5) NOT NULL,
    "cierre" VARCHAR(5) NOT NULL,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "horarios_puntos_interes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "horarios_puntos_interes_punto_interes_id_fkey" FOREIGN KEY ("punto_interes_id") REFERENCES "puntos_interes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "horarios_puntos_interes_punto_interes_id_dia_key" ON "horarios_puntos_interes"("punto_interes_id", "dia");

CREATE TABLE "imagenes_puntos_interes" (
    "id" SERIAL NOT NULL,
    "punto_interes_id" INTEGER NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "texto_alternativo" VARCHAR(200),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "imagenes_puntos_interes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "imagenes_puntos_interes_punto_interes_id_fkey" FOREIGN KEY ("punto_interes_id") REFERENCES "puntos_interes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "imagenes_puntos_interes_punto_interes_id_orden_idx" ON "imagenes_puntos_interes"("punto_interes_id", "orden");

CREATE TABLE "contactos_puntos_interes" (
    "id" SERIAL NOT NULL,
    "punto_interes_id" INTEGER NOT NULL,
    "telefono" VARCHAR(30),
    "whatsapp" VARCHAR(30),
    "sitio_web" VARCHAR(2048),
    "contacto_emergencia" VARCHAR(150),
    "telefono_emergencia" VARCHAR(30),
    CONSTRAINT "contactos_puntos_interes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "contactos_puntos_interes_punto_interes_id_key" UNIQUE ("punto_interes_id"),
    CONSTRAINT "contactos_puntos_interes_punto_interes_id_fkey" FOREIGN KEY ("punto_interes_id") REFERENCES "puntos_interes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);