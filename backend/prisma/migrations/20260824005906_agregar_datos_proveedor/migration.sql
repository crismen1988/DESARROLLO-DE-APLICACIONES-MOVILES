-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "actividad_turistica" VARCHAR(180),
ADD COLUMN     "ciudad" VARCHAR(80),
ADD COLUMN     "direccion" VARCHAR(250),
ADD COLUMN     "nombre_comercial" VARCHAR(150),
ADD COLUMN     "razon_social" VARCHAR(180),
ADD COLUMN     "sitio_web" VARCHAR(2048),
ADD COLUMN     "telefono" VARCHAR(30);
