-- Taller de optimización: usuarios, puntos de interés y reseñas.
CREATE TYPE "Rol" AS ENUM ('TURISTA', 'PROVEEDOR', 'ADMINISTRADOR');
CREATE TYPE "EstadoPuntoInteres" AS ENUM ('ACTIVO', 'INACTIVO');

CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "correo" VARCHAR(180) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'TURISTA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

CREATE TABLE "puntos_interes" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "direccion" VARCHAR(250),
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "telefono" VARCHAR(30),
    "precio_minimo" DECIMAL(10,2),
    "precio_maximo" DECIMAL(10,2),
    "calificacion_promedio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_resenas" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoPuntoInteres" NOT NULL DEFAULT 'ACTIVO',
    "categoria_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "puntos_interes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "puntos_interes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "puntos_interes_categoria_id_estado_idx" ON "puntos_interes"("categoria_id", "estado");
CREATE INDEX "puntos_interes_latitud_longitud_idx" ON "puntos_interes"("latitud", "longitud");

CREATE TABLE "resenas" (
    "id" SERIAL NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "comentario" VARCHAR(500),
    "usuario_id" INTEGER NOT NULL,
    "punto_interes_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "resenas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "resenas_punto_interes_id_fkey" FOREIGN KEY ("punto_interes_id") REFERENCES "puntos_interes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "resenas_calificacion_check" CHECK ("calificacion" BETWEEN 1 AND 5)
);
CREATE UNIQUE INDEX "resenas_usuario_id_punto_interes_id_key" ON "resenas"("usuario_id", "punto_interes_id");
CREATE INDEX "resenas_punto_interes_id_idx" ON "resenas"("punto_interes_id");
