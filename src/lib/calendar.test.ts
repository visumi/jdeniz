import { describe, expect, it } from "vitest";
import { buildBirthdayIcs, getBirthdayDateForYear } from "./calendar";

describe("birthday calendar events", () => {
  it("creates a one-day all-day event for the current year", () => {
    const ics = buildBirthdayIcs({
      studentId: "student-1",
      name: "Diego",
      birthDate: "1990-09-01",
      year: 2026,
      timestamp: new Date("2026-01-02T03:04:05Z")
    });

    expect(ics).toContain("DTSTART;VALUE=DATE:20260901");
    expect(ics).toContain("DTEND;VALUE=DATE:20260902");
    expect(ics).toContain("SUMMARY:Aniversário de Diego");
    expect(ics).toContain("DESCRIPTION:Aniversário de Diego — JDeniz");
    expect(ics).not.toContain("RRULE");
    expect(ics).toContain("DTSTAMP:20260102T030405Z");
  });

  it("escapes iCalendar punctuation and line breaks", () => {
    const ics = buildBirthdayIcs({
      studentId: "student-1",
      name: "Ana, Lima;\nEquipe",
      birthDate: "1990-09-01",
      year: 2026,
      timestamp: new Date("2026-01-02T03:04:05Z")
    });

    expect(ics).toContain("SUMMARY:Aniversário de Ana\\, Lima\\;\\nEquipe");
    expect(ics).toContain("DESCRIPTION:Aniversário de Ana\\, Lima\\;\\nEquipe — JDeniz");
  });

  it("rejects February 29 when the target year is not a leap year", () => {
    expect(getBirthdayDateForYear("2000-02-29", 2026)).toBeNull();
    expect(getBirthdayDateForYear("2000-02-29", 2028)).toBe("20280229");
  });
});
