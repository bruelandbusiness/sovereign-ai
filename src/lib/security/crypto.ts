import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const ENCODING = "base64" as const;
const KEY_LENGTH = 32; // 256 bits

/**
 * Resolve the encryption key from the environment variable.
 * Accepts hex-encoded (64 chars) or base64-encoded (44 chars) keys,
 * both of which must decode to exactly 32 bytes.
 *
 * @throws {Error} If ENCRYPTION_KEY is missing or decodes to the wrong length.
 */
function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
        "Generate one with generateEncryptionKey() and add it to your environment."
    );
  }

  let keyBuffer: Buffer;

  // Try hex first (64 hex chars = 32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    keyBuffer = Buffer.from(raw, "hex");
  }
  // Try base64 (44 chars with optional padding = 32 bytes)
  else if (/^[A-Za-z0-9+/]{43}=?$/.test(raw) || /^[A-Za-z0-9+/]{42}==?$/.test(raw)) {
    keyBuffer = Buffer.from(raw, "base64");
  }
  // Treat as raw bytes if exactly 32 bytes
  else if (Buffer.byteLength(raw, "utf8") === KEY_LENGTH) {
    keyBuffer = Buffer.from(raw, "utf8");
  } else {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 32 bytes. Received a value that could not be ` +
        `decoded as hex (64 chars), base64 (44 chars), or raw UTF-8 (32 bytes). ` +
        `Use generateEncryptionKey() to create a valid key.`
    );
  }

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY decoded to ${keyBuffer.length} bytes but must be exactly ${KEY_LENGTH} bytes (256 bits).`
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a PII field for storage.
 *
 * Uses AES-256-GCM with a random IV per encryption to ensure that
 * identical plaintext values produce different ciphertext each time.
 *
 * @param value - The plaintext PII string to encrypt.
 * @returns A base64 string containing `iv + authTag + ciphertext`.
 * @throws {Error} If ENCRYPTION_KEY is not configured or is invalid.
 *
 * @example
 * ```ts
 * const encrypted = encryptPII("user@example.com");
 * // => "base64-encoded string"
 * ```
 */
export function encryptPII(value: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Concatenate: IV (16) + AuthTag (16) + Ciphertext (variable)
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString(ENCODING);
}

/**
 * Decrypt a PII field for use.
 *
 * Expects the format produced by {@link encryptPII}: `base64(iv + authTag + ciphertext)`.
 *
 * @param encrypted - The base64-encoded encrypted string.
 * @returns The original plaintext value.
 * @throws {Error} If ENCRYPTION_KEY is not configured, the data is corrupted, or authentication fails.
 *
 * @example
 * ```ts
 * const plaintext = decryptPII(encrypted);
 * // => "user@example.com"
 * ```
 */
export function decryptPII(encrypted: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encrypted, ENCODING);

  if (combined.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error(
      "Encrypted data is too short. Expected at least " +
        `${IV_LENGTH + TAG_LENGTH} bytes (IV + auth tag), got ${combined.length}.`
    );
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Check whether the ENCRYPTION_KEY environment variable is set.
 *
 * Does not validate key format or length -- use this as a quick guard
 * before attempting encryption operations.
 *
 * @returns `true` if ENCRYPTION_KEY is present in the environment.
 */
export function isEncryptionConfigured(): boolean {
  return typeof process.env.ENCRYPTION_KEY === "string" && process.env.ENCRYPTION_KEY.length > 0;
}

/**
 * Generate a cryptographically secure encryption key.
 *
 * Returns a 32-byte (256-bit) key encoded as a 64-character hex string,
 * suitable for use as the ENCRYPTION_KEY environment variable.
 *
 * @returns A random 64-character hex string.
 *
 * @example
 * ```ts
 * const key = generateEncryptionKey();
 * // => "a1b2c3d4...64 hex chars"
 * // Add to .env: ENCRYPTION_KEY=a1b2c3d4...
 * ```
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}

/**
 * Hash a value for logging purposes.
 *
 * Produces a truncated SHA-256 hash so that PII can be correlated
 * across log entries without exposing the actual value.
 *
 * @param value - The string to hash (e.g., an email address).
 * @returns The first 12 characters of the hex-encoded SHA-256 digest.
 *
 * @example
 * ```ts
 * hashForLog("user@example.com");
 * // => "b4c9a289323b"
 * ```
 */
export function hashForLog(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").substring(0, 12);
}

// ---------------------------------------------------------------------------
// PII Field Registry
// ---------------------------------------------------------------------------

/** Sensitivity level for a PII field. */
export type PIISensitivity = "high" | "medium" | "low";

/** Describes a field in the database that contains PII. */
export interface PIIField {
  /** Database table name. */
  table: string;
  /** Column / field name. */
  field: string;
  /** How sensitive this data is (determines handling requirements). */
  sensitivity: PIISensitivity;
  /** Whether the field is encrypted at rest using AES-256-GCM. */
  encrypted: boolean;
}

/**
 * Registry of all PII fields across the Sovereign Empire database.
 *
 * - **HIGH** sensitivity: encrypted at rest + in transit.
 * - **MEDIUM** sensitivity: encrypted in transit, access-controlled.
 * - **LOW** sensitivity: standard protection.
 *
 * Payment info is handled by Stripe and never stored by us.
 * CRM credentials are high sensitivity but live in env / secrets manager.
 */
export const PII_REGISTRY: PIIField[] = [
  // HIGH -- encrypted at rest + in transit
  { table: "leads", field: "phone", sensitivity: "high", encrypted: true },
  { table: "leads", field: "email", sensitivity: "high", encrypted: true },
  { table: "leads", field: "address", sensitivity: "high", encrypted: true },
  { table: "clients", field: "contact_email", sensitivity: "high", encrypted: true },
  { table: "clients", field: "contact_phone", sensitivity: "high", encrypted: true },

  // MEDIUM -- encrypted in transit, access-controlled
  { table: "leads", field: "name", sensitivity: "medium", encrypted: false },
  { table: "leads", field: "property_data", sensitivity: "medium", encrypted: false },
  { table: "outreach", field: "message_content", sensitivity: "medium", encrypted: false },
  { table: "clients", field: "company_name", sensitivity: "medium", encrypted: false },

  // LOW -- standard protection
  { table: "leads", field: "score", sensitivity: "low", encrypted: false },
  { table: "metrics", field: "aggregate_data", sensitivity: "low", encrypted: false },
  { table: "agents", field: "run_logs", sensitivity: "low", encrypted: false },
];

/**
 * Get all PII fields that are encrypted at rest.
 *
 * @returns An array of {@link PIIField} entries where `encrypted` is `true`.
 */
export function getEncryptedFields(): PIIField[] {
  return PII_REGISTRY.filter((f) => f.encrypted);
}

/**
 * Check whether a specific database field is encrypted at rest.
 *
 * @param table - The database table name.
 * @param field - The column / field name.
 * @returns `true` if the field is in the registry and marked as encrypted.
 */
export function isFieldEncrypted(table: string, field: string): boolean {
  const entry = PII_REGISTRY.find((f) => f.table === table && f.field === field);
  return entry?.encrypted ?? false;
}

/**
 * Look up the sensitivity level of a database field.
 *
 * @param table - The database table name.
 * @param field - The column / field name.
 * @returns The {@link PIISensitivity} level, or `null` if the field is not in the registry.
 */
export function getFieldSensitivity(table: string, field: string): PIISensitivity | null {
  const entry = PII_REGISTRY.find((f) => f.table === table && f.field === field);
  return entry?.sensitivity ?? null;
}
