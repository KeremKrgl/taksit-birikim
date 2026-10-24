import { describe, expect, it } from "vitest";
import { localizedPath } from "@/lib/redirect-path";

describe("localizedPath", () => {
  it("leaves Turkish paths alone and prefixes English ones", () => {
    expect(localizedPath("/", "tr")).toBe("/");
    expect(localizedPath("/hesap", "tr")).toBe("/hesap");
    expect(localizedPath("/", "en")).toBe("/en");
    expect(localizedPath("/hesap", "en")).toBe("/en/hesap");
  });
});
