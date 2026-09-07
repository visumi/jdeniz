export interface BirthdayCalendarEvent {
  studentId: string;
  name: string;
  birthDate: string;
  year?: number;
  timestamp?: Date;
}

export function getBirthdayDateForYear(birthDate: string, year = new Date().getFullYear()): string | null {
  const [, month, day] = birthDate.split("-").map(Number);
  if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (month === 2 && day === 29 && !isLeapYear(year)) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return formatCalendarDate(date);
}

export function buildBirthdayIcs(input: BirthdayCalendarEvent): string {
  const year = input.year ?? new Date().getFullYear();
  const startDate = getBirthdayDateForYear(input.birthDate, year);
  if (!startDate) throw new Error("birthday_date_unavailable");

  const endDate = shiftCalendarDate(startDate, 1);
  const summary = `Aniversário de ${input.name}`;
  const description = `${summary} — JDeniz`;
  const timestamp = formatCalendarTimestamp(input.timestamp ?? new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JDeniz//Aniversarios//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:birthday-${escapeUidPart(input.studentId)}-${year}@jdeniz`,
    `DTSTAMP:${timestamp}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  return `${lines.join("\r\n")}\r\n`;
}

export function downloadBirthdayIcs(input: BirthdayCalendarEvent): void {
  const content = buildBirthdayIcs(input);
  const year = input.year ?? new Date().getFullYear();
  const filename = `aniversario-${slugify(input.name)}-${year}.ics`;
  const blobUrl = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.setAttribute("aria-hidden", "true");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

function escapeUidPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function formatCalendarDate(date: Date): string {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

function shiftCalendarDate(value: string, days: number): string {
  const date = new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8)) + days));
  return formatCalendarDate(date);
}

function formatCalendarTimestamp(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  const hours = String(value.getUTCHours()).padStart(2, "0");
  const minutes = String(value.getUTCMinutes()).padStart(2, "0");
  const seconds = String(value.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function slugify(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "aluno";
}
