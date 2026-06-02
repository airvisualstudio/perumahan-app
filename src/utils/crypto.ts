/**
 * Simple hash helper to simulate HMAC-SHA256 signature
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Convert to positive hex representation
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  // Return a 16-character pseudo-hash based on multiple shifts
  let hash2 = 17;
  for (let i = input.length - 1; i >= 0; i--) {
    const char = input.charCodeAt(i);
    hash2 = (hash2 << 3) - hash2 + char;
    hash2 |= 0;
  }
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  return hex + hex2; // 16 chars signature
}

const SECRET_SALT = 'domus-somnia-secure-salt-2026';

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a signed doc_token (UUID v4 + 16 chars signature)
 * Returns a 32-character token (or containing dashes)
 */
export function generateSignedToken(docId: string): string {
  const cleanId = docId || generateUUID();
  const signature = simpleHash(cleanId + SECRET_SALT);
  return `${cleanId}_${signature}`;
}

/**
 * Verify if the signed doc_token is valid
 */
export function verifyToken(token: string): { isValid: boolean; docId: string | null } {
  if (!token || !token.includes('_')) {
    return { isValid: false, docId: null };
  }
  
  const [docId, signature] = token.split('_');
  const expectedSignature = simpleHash(docId + SECRET_SALT);
  
  if (signature === expectedSignature) {
    return { isValid: true, docId };
  }
  
  return { isValid: false, docId: null };
}
