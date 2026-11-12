/**
 * Input normalization shared by validation and domain code.
 * Business identity matching (client dedupe) relies on these being stable.
 */

/** Trim and lowercase an email so equivalent addresses compare equal. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Trim an external (CRM) identifier. Case is preserved: external IDs are opaque. */
export function normalizeExternalId(externalId: string): string {
  return externalId.trim();
}
