import { describe, expect, it } from "vitest";
import { validateStudentInput } from "../src/students";

describe("validateStudentInput", () => {
  it("normaliza campos opcionais", () => {
    expect(validateStudentInput({ name: "  Ana Lima ", email: " ana@example.com ", phone: " " })).toEqual({ name: "Ana Lima", email: "ana@example.com", phone: null, attendanceMode: null, birthDate: null, startDate: null, pathology: null, observations: null });
  });

  it("exige nome", () => {
    expect(() => validateStudentInput({ name: " " })).toThrowError("name_required");
  });

  it("valida e-mail", () => {
    expect(() => validateStudentInput({ name: "Ana", email: "invalid" })).toThrowError("invalid_email");
  });
});
