/**
 * AetherCore - Privacy Shield Guardrail Module
 * 2050-Ready Open Architecture for Humanity
 * Zero-bloat payload sanitization and privacy boundary helper.
 */

const DEFAULT_REDACTED_KEYS = Object.freeze([
  "password",
  "passcode",
  "secret",
  "token",
  "apiKey",
  "api_key",
  "ssn",
  "aadhaar",
  "pan"
]);

export class PrivacyShield {
  constructor(options = {}) {
    const extraKeys = Array.isArray(options.redactKeys) ? options.redactKeys : [];
    this.redactSet = new Set(
      [...DEFAULT_REDACTED_KEYS, ...extraKeys].map((key) => String(key).toLowerCase())
    );
    this.redactionMask = options.mask || "[REDACTED]";
  }

  sanitize(input) {
    if (input === null || input === undefined) {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitize(item));
    }

    if (typeof input === "object") {
      const cleanObj = {};
      for (const [key, value] of Object.entries(input)) {
        if (this.redactSet.has(String(key).toLowerCase())) {
          cleanObj[key] = this.redactionMask;
        } else {
          cleanObj[key] = this.sanitize(value);
        }
      }
      return cleanObj;
    }

    return input;
  }

  assertCleanPayload(payload) {
    const serialized = JSON.stringify(payload ?? {});
    for (const key of this.redactSet) {
      const pattern = new RegExp(`"${key}"\\s*:`, "i");
      if (pattern.test(serialized)) {
        throw new Error(`AetherCore PrivacyShield: Blocked sensitive key "${key}" in payload.`);
      }
    }
    return true;
  }
}
