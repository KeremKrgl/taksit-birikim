// Bump CONSENT_VERSION whenever the aydınlatma metni or the consent wording changes;
// everyone is asked again on their next visit.
export const CONSENT_VERSION = "2026-10";

export const CONSENT_KINDS = ["kvkk_notice", "abroad_transfer", "analytics", "marketing", "push"] as const;
export type ConsentKind = (typeof CONSENT_KINDS)[number];

/** Needed to use the app at all. The rest are optional and can be changed any time. */
export const REQUIRED_CONSENTS = ["kvkk_notice", "abroad_transfer"] as const satisfies readonly ConsentKind[];

export type ConsentState = {
  kvkk_notice_version: string | null;
  abroad_transfer_version: string | null;
};

export function hasCurrentConsent(p: ConsentState): boolean {
  return p.kvkk_notice_version === CONSENT_VERSION && p.abroad_transfer_version === CONSENT_VERSION;
}
