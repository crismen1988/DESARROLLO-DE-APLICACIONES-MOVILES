import { config } from 'dotenv';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';

config();
config({ path: resolve(__dirname, '../../.env'), override: false });

const prismaRequire = createRequire(__filename);
const { PrismaClient } = prismaRequire('../dist/src/generated/prisma/client.js') as typeof import('../src/generated/prisma/client');

const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME ?? 'Administrador Maestro';

if (!databaseUrl || !adminEmail || !adminPassword) {
  throw new Error('DATABASE_URL, ADMIN_EMAIL y ADMIN_PASSWORD son obligatorios para crear el administrador');
}

if (adminPassword.length < 12) {
  throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres');
}

const configuredAdminEmail = adminEmail;
const configuredAdminPassword = adminPassword;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function seedAdmin(): Promise<void> {
  const passwordHash = await hash(configuredAdminPassword, 12);
  await prisma.usuario.upsert({
    where: { correo: configuredAdminEmail.trim().toLowerCase() },
    update: {
      nombre: adminName,
      rol: 'ADMINISTRADOR',
      activo: true,
      proveedorVerificado: false,
      tipoCuenta: 'TURISTA',
      ruc: null,
      estadoVerificacion: 'NO_APLICA',
      passwordHash,
    },
    create: {
      correo: configuredAdminEmail.trim().toLowerCase(),
      nombre: adminName,
      passwordHash,
      rol: 'ADMINISTRADOR',
      activo: true,
      tipoCuenta: 'TURISTA',
      estadoVerificacion: 'NO_APLICA',
    },
  });
}

seedAdmin()
  .catch((error: unknown) => {
    console.error('No se pudo crear el administrador maestro', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });