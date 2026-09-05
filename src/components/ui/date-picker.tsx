import { CalendarDays } from "lucide-react";
import { forwardRef, useEffect, useId, useRef, useState, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { Calendar, formatDateLabel, parseDateValue } from "./calendar";
import { FloatingPanel } from "./popover";

type DatePickerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "onChange" | "type"> & {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(({ id, name, value = "", onChange, placeholder = "Selecione uma data", className, disabled, onBlur, ...props }, ref) => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => parseDateValue(value) || new Date());
  const contentId = useId();
  const setRefs = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      const content = document.getElementById(contentId);
      if (!triggerRef.current?.contains(target) && !content?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [contentId, open]);

  function toggleOpen() {
    if (disabled) return;
    if (!open) setMonth(parseDateValue(value) || new Date());
    setOpen((current) => !current);
  }

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return <>
    <button ref={setRefs} id={id} name={name} type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={contentId} disabled={disabled} className={cn("flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 text-left text-base text-foreground shadow-none outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 md:text-sm", !value && "text-muted-foreground", className)} onClick={toggleOpen} onBlur={onBlur} {...props}><span className="truncate">{value ? formatDateLabel(value) : placeholder}</span><CalendarDays aria-hidden="true" className="size-4 shrink-0 text-slate-500" /></button>
    <FloatingPanel open={open} anchorRef={triggerRef} id={contentId} role="dialog" ariaLabel="Selecionar data" className="p-3"><Calendar month={month} selected={value} onMonthChange={setMonth} onSelect={handleSelect} /></FloatingPanel>
  </>;
});
DatePicker.displayName = "DatePicker";
