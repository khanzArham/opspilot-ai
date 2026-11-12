import { describe, expect, it } from "vitest";
import {
  normalizeEmail,
  normalizeExternalId,
} from "@/lib/utils/normalize";

describe("normalizeEmail", () => {
  it("trims whitespace and lowercases", () => {
    expect(normalizeEmail("  Ops@NorthStar.Example ")).toBe(
      "ops@northstar.example",
    );
  });

  it("maps case-variant addresses to the same key", () => {
    expect(normalizeEmail("A@Client.example")).toBe(
      normalizeEmail(" a@client.EXAMPLE"),
    );
  });
});

describe("normalizeExternalId", () => {
  it("trims whitespace", () => {
    expect(normalizeExternalId("  crm-1042\n")).toBe("crm-1042");
  });

  it("preserves case because external IDs are opaque", () => {
    expect(normalizeExternalId("CRM-abc")).not.toBe(
      normalizeExternalId("crm-ABC"),
    );
  });
});
