import { describe, expect, it } from "vitest";
import { resolveAccessDecision } from "../src/access";

const env = { OWNER_EMAIL: "owner@example.com" };

describe("resolveAccessDecision", () => {
  it("autoriza o owner mesmo sem grant", () => {
    expect(resolveAccessDecision("OWNER@example.com", null, env)).toEqual({ allowed: true, role: "owner" });
  });

  it("autoriza um membro ativo", () => {
    expect(resolveAccessDecision("member@example.com", { role: "member", active: 1 }, env)).toEqual({ allowed: true, role: "member" });
  });

  it("bloqueia grant inativo ou ausente", () => {
    expect(resolveAccessDecision("member@example.com", { role: "member", active: 0 }, env).allowed).toBe(false);
    expect(resolveAccessDecision("other@example.com", null, env).allowed).toBe(false);
  });
});
