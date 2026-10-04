import crypto from 'crypto';

interface AccessToken {
  value: string;
  expiresAt: number;
}

let cachedToken: AccessToken | null = null;

const base64Url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

function firebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  return projectId && clientEmail && privateKey ? { projectId, clientEmail, privateKey } : null;
}

async function getAccessToken(config: NonNullable<ReturnType<typeof firebaseConfig>>): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url(JSON.stringify({
    iss: config.clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claim}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), config.privateKey).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!response.ok) throw new Error(`No se pudo autenticar con Firebase (${response.status})`);
  const data = await response.json() as { access_token: string; expires_in?: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return data.access_token;
}

export async function sendPushToTokens(
  tokens: string[],
  notification: { title: string; body: string; type: string; id: string }
): Promise<{ configured: boolean; sent: number; failed: number }> {
  const config = firebaseConfig();
  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  if (!config || uniqueTokens.length === 0) return { configured: Boolean(config), sent: 0, failed: 0 };
  const accessToken = await getAccessToken(config);
  const results = await Promise.allSettled(uniqueTokens.map(async token => {
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: notification.title, body: notification.body },
          data: { notificationId: notification.id, type: notification.type },
          android: { priority: 'high', notification: { channel_id: 'banostour_alertas', sound: 'default' } },
        },
      }),
    });
    if (!response.ok) throw new Error(`FCM ${response.status}`);
  }));
  const sent = results.filter(result => result.status === 'fulfilled').length;
  return { configured: true, sent, failed: results.length - sent };
}
