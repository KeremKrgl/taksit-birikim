import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("translations", () => {
  it("Turkish and English have exactly the same keys", () => {
    expect(keys(en).sort()).toEqual(keys(tr).sort());
  });

  it("no message is empty", () => {
    for (const [name, messages] of [["tr", tr], ["en", en]] as const) {
      const empty = keys(messages).filter((k) => {
        const value = k.split(".").reduce<unknown>((o, part) => (o as Record<string, unknown>)[part], messages);
        return typeof value !== "string" || value.trim() === "";
      });
      expect(empty, name).toEqual([]);
    }
  });
});
