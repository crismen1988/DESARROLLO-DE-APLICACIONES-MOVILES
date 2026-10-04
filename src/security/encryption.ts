import crypto from 'crypto';
import { ENV } from '../config/environment';
import { EncryptedData } from '../types';

/**
 * AES-256-GCM Cryptographic Helper
 * Encrypts sensitive tourist identity data (passports, national IDs, payment hashes)
 * in compliance with Ecuador LOPDP and international GDPR data protection standards.
 * Uses GCM mode to provide both confidentiality and authenticity.
 */
export function encryptAES256(text: string): EncryptedData {
  const iv = crypto.randomBytes(12); // GCM standard IV length is 12 bytes
  const cipher = crypto.createCipheriv('aes-256-gcm', ENV.AES_DERIVED_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // We store the authTag along with the encrypted data to ensure integrity during decryption
  return { 
    iv: iv.toString('hex'), 
    encryptedData: `${encrypted}:${authTag}` 
  };
}

/**
 * Decrypts AES-256-GCM payload using master key and initialization vector (IV)
 * Validates the authentication tag to prevent tampering.
 */
export function decryptAES256(encryptedDataWithTag: string, ivHex: string): string {
  try {
    const [encryptedData, authTagHex] = encryptedDataWithTag.split(':');
    if (!authTagHex) throw new Error('Invalid encrypted data format');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENV.AES_DERIVED_KEY, iv);
    
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[Decryption Error]:', error);
    return '[Error: fallo de desencriptación de credenciales seguras - integridad comprometida]';
  }
}
