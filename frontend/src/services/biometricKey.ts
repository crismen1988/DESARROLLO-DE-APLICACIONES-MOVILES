import { Capacitor, registerPlugin } from '@capacitor/core';
interface BiometricKeyPlugin { enroll(): Promise<{ keyId: string; publicKey: string }>; sign(options: { challenge: string }): Promise<{ signature: string }>; removeKey(): Promise<void>; }
const NativeBiometricKey = registerPlugin<BiometricKeyPlugin>('BiometricKey');
export const biometricKey = { isAvailable: () => Capacitor.getPlatform() === 'android', enroll: () => NativeBiometricKey.enroll(), sign: (challenge: string) => NativeBiometricKey.sign({ challenge }), removeKey: () => NativeBiometricKey.removeKey() };
