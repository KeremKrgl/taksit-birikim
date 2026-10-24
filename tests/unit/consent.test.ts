import { describe, expect, it } from "vitest";
import { CONSENT_VERSION, hasCurrentConsent } from "@/lib/consent";

describe("hasCurrentConsent", () => {
  it("needs both required consents at the current version", () => {
    expect(hasCurrentConsent({ kvkk_notice_version: CONSENT_VERSION, abroad_transfer_version: CONSENT_VERSION })).toBe(true);
    expect(hasCurrentConsent({ kvkk_notice_version: CONSENT_VERSION, abroad_transfer_version: null })).toBe(false);
    expect(hasCurrentConsent({ kvkk_notice_version: null, abroad_transfer_version: CONSENT_VERSION })).toBe(false);
  });

  it("asks again when the notice version changes", () => {
    expect(hasCurrentConsent({ kvkk_notice_version: "2020-01", abroad_transfer_version: "2020-01" })).toBe(false);
  });
});
