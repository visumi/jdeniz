import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { cn } from "../../lib/utils";

export type CalendarProps = {
  month: Date;
  selected?: string;
  onMonthChange: (month: Date) => void;
  onSelect: (value: string) => void;
};

const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });

export function Calendar({ month, selected, onMonthChange, onSelect }: CalendarProps) {
  const days = useMemo(() => getCalendarDays(month), [month]);
  const currentMonth = month.getMonth();
  return <div aria-label="Calendário" className="w-[min(100%,20rem)]">
    <header className="mb-3 flex items-center justify-between gap-3">
      <p className="text-sm font-semibold capitalize text-slate-950">{monthFormatter.format(month)}</p>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Mês anterior" className="grid size-9 cursor-pointer place-items-center rounded-md text-slate-600 transition-colors duration-150 hover:bg-sky-50 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft aria-hidden="true" className="size-4" /></button>
        <button type="button" aria-label="Próximo mês" className="grid size-9 cursor-pointer place-items-center rounded-md text-slate-600 transition-colors duration-150 hover:bg-sky-50 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight aria-hidden="true" className="size-4" /></button>
      </div>
    </header>
    <div role="grid" aria-label={monthFormatter.format(month)} className="grid grid-cols-7 gap-1">
      {weekdayLabels.map((weekday) => <span key={weekday} role="columnheader" className="grid h-8 place-items-center text-[0.7rem] font-semibold text-slate-500">{weekday}</span>)}
      {days.map((day) => {
        const value = toDateValue(day);
        const isSelected = value === selected;
        const isOutside = day.getMonth() !== currentMonth;
        const isToday = value === toDateValue(new Date());
        return <button key={value} type="button" role="gridcell" aria-selected={isSelected} aria-label={dateFormatter.format(day)} className={cn("grid size-9 cursor-pointer place-items-center rounded-md text-sm text-slate-700 outline-none transition-colors duration-150 hover:bg-sky-50 hover:text-sky-950 focus-visible:ring-2 focus-visible:ring-ring", isOutside && "text-slate-400", isToday && !isSelected && "font-bold text-sky-700", isSelected && "bg-sky-600 font-semibold text-white hover:bg-sky-700 hover:text-white")} onClick={() => onSelect(value)}>{day.getDate()}</button>;
      })}
    </div>
  </div>;
}

export function toDateValue(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function parseDateValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function formatDateLabel(value: string): string {
  const date = parseDateValue(value);
  return date ? dateFormatter.format(date) : "";
}

function getCalendarDays(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}
