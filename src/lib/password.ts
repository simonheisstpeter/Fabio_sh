import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const PARAMS = { N: 65536, r: 8, p: 1 };
const KEY_LEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(32);
  const hash = await scryptAsync(password, salt, KEY_LEN, PARAMS) as Buffer;
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'hex');
  const expected = Buffer.from(parts[2], 'hex');
  const actual = await scryptAsync(password, salt, KEY_LEN, PARAMS) as Buffer;
  return timingSafeEqual(actual, expected);
}

// Dummy hash — keeps timing consistent when no admin credential exists
export const DUMMY_HASH = `scrypt:${'0'.repeat(64)}:${'0'.repeat(128)}`;
