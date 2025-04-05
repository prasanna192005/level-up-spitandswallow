import { subtle } from 'crypto';

export async function generateKeyPair() {
  const keyPair = await subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  );
  return keyPair;
}

export async function signDelivery(privateKey: CryptoKey, data: string) {
  const signature = await subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    new TextEncoder().encode(data)
  );
  return Buffer.from(signature).toString('base64');
}

export async function verifySignature(publicKey: CryptoKey, signature: string, data: string) {
  const isValid = await subtle.verify(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    publicKey,
    Buffer.from(signature, 'base64'),
    new TextEncoder().encode(data)
  );
  return isValid;
} 