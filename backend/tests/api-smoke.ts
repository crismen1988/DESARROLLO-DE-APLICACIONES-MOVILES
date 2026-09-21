import 'reflect-metadata';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/nest.module';
import { db } from '../src/db/store';
import { generateToken } from '../src/security/jwt';

db.persist = async () => {};
const app = await NestFactory.create(AppModule, { logger: false });
app.setGlobalPrefix('api');
await app.listen(0, '127.0.0.1');
try {
  const address = app.getHttpServer().address();
  if (!address || typeof address === 'string') throw new Error('No port');
  const base = `http://127.0.0.1:${address.port}/api`;
  const request = (path: string, method = 'GET', body?: object, headers?: Record<string, string>) =>
    fetch(base + path, { method, body: body ? JSON.stringify(body) : undefined, headers: { 'Content-Type': 'application/json', ...headers } });

  assert.equal((await request('/tours')).status, 200);
  assert.equal((await request('/puntos-interes')).status, 200);
  assert.equal((await request('/admin/users')).status, 401);

  const registered = await request('/auth/register', 'POST', { name: 'Prueba', email: 'prueba@example.com', password: 'prueba123', role: 'turista' });
  assert.equal(registered.status, 201);
  const { token } = await registered.json() as { token: string };
  const cookie = registered.headers.get('set-cookie')!.split(';')[0];
  assert.ok(cookie);

  const firstRefresh = await request('/auth/refresh', 'POST', undefined, { Cookie: cookie });
  assert.equal(firstRefresh.status, 200);
  assert.equal((await request('/auth/refresh', 'POST', undefined, { Cookie: cookie })).status, 401);

  const auth = { Authorization: `Bearer ${token}` };
  const biometricPair = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const biometricPublicKey = biometricPair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64url');
  const biometricKeyId = 'test-device-key';
  assert.equal((await request('/auth/biometric/enroll', 'POST', { keyId: biometricKeyId, publicKey: biometricPublicKey }, auth)).status, 204);
  const challengeResponse = await request('/auth/biometric', 'POST', { action: 'challenge', userId: (db.users.find(user => user.email === 'prueba@example.com'))!.id, keyId: biometricKeyId });
  assert.equal(challengeResponse.status, 201);
  const challenge = await challengeResponse.json() as { challengeId: string; challenge: string };
  const biometricSignature = crypto.sign('sha256', Buffer.from(challenge.challenge, 'base64url'), biometricPair.privateKey).toString('base64url');
  const biometricLogin = await request('/auth/biometric', 'POST', { action: 'verify', userId: (db.users.find(user => user.email === 'prueba@example.com'))!.id, keyId: biometricKeyId, challengeId: challenge.challengeId, signature: biometricSignature });
  assert.equal(biometricLogin.status, 201);
  const biometricLoginJson = await biometricLogin.json() as { token: string; biometricUsed: boolean };
  assert.ok(biometricLoginJson.token);
  assert.equal(biometricLoginJson.biometricUsed, true);
  assert.equal((await request('/auth/biometric', 'POST', { action: 'verify', userId: (db.users.find(user => user.email === 'prueba@example.com'))!.id, keyId: biometricKeyId, challengeId: challenge.challengeId, signature: biometricSignature })).status, 401);
  assert.equal((await request('/auth/biometric/revoke', 'POST', undefined, auth)).status, 204);
  assert.equal((await request('/auth/biometric', 'POST', { action: 'challenge', userId: (db.users.find(user => user.email === 'prueba@example.com'))!.id, keyId: biometricKeyId })).status, 401);
  assert.equal((await request('/usuarios/perfil', 'PUT', {
    name: 'Prueba Actualizada',
    avatarUrl: 'https://example.com/avatar.png',
    phone: '+593 99 123 4567',
    origin: 'Ambato, Ecuador',
    language: 'en',
    pushEnabled: true,
  }, auth)).status, 200);
  const updatedProfile = await request('/usuarios/perfil', 'GET', undefined, auth);
  assert.equal(updatedProfile.status, 200);
  const updatedProfileJson = await updatedProfile.json() as { name: string; avatarUrl?: string; phone?: string; language?: string; pushEnabled?: boolean };
  assert.equal(updatedProfileJson.name, 'Prueba Actualizada');
  assert.equal(updatedProfileJson.avatarUrl, 'https://example.com/avatar.png');
  assert.equal(updatedProfileJson.phone, '+593 99 123 4567');
  assert.equal(updatedProfileJson.language, 'en');
  assert.equal(updatedProfileJson.pushEnabled, true);
  assert.equal((await request('/favoritos', 'POST', { poiId: 'place-1' }, auth)).status, 201);
  assert.equal((await request('/favoritos', 'POST', { poiId: 'place-1' }, auth)).status, 409);
  assert.equal((await request('/resenas', 'POST', { poiId: 'place-1', rating: 7, comment: 'Mal' }, auth)).status, 400);
  assert.equal((await request('/resenas', 'POST', { poiId: 'place-1', rating: 5, comment: 'Muy bien' }, auth)).status, 201);
  assert.equal((await request('/puntos-interes/place-1')).status, 200);
  assert.equal((await request('/puntos-interes/place-1', 'DELETE', undefined, auth)).status, 403);

  const operator = db.users.find(user => user.role === 'operador');
  assert.ok(operator);
  const operatorAuth = { Authorization: `Bearer ${generateToken(operator)}` };
  const createdTourResponse = await request('/tours', 'POST', {
    title: 'Tour editable de prueba',
    price: 25,
    duration: '3 horas',
    difficulty: 'Moderado',
    category: 'Aventura',
    maxCapacity: 12,
    description: 'Servicio temporal para validar edición y eliminación.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
  }, operatorAuth);
  assert.equal(createdTourResponse.status, 201);
  const createdTour = await createdTourResponse.json() as { id: string };
  assert.equal((await request(`/tours/${createdTour.id}`, 'PUT', {
    title: 'Tour editado de prueba',
    price: 30,
    duration: '4 horas',
    difficulty: 'Exigente',
    category: 'Naturaleza',
    maxCapacity: 10,
    description: 'Contenido actualizado por el operador propietario.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
  }, operatorAuth)).status, 200);
  assert.equal((await request(`/tours/${createdTour.id}`, 'PUT', {
    title: 'Intento ajeno', price: 10, duration: '1 hora', difficulty: 'Fácil',
    category: 'Cultura', maxCapacity: 2, description: 'Sin permiso',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
  }, auth)).status, 403);
  assert.equal((await request(`/tours/${createdTour.id}`, 'DELETE', undefined, operatorAuth)).status, 204);
  console.log('API NestJS: rutas, roles, renovación y validaciones OK');
} finally {
  await app.close();
}
