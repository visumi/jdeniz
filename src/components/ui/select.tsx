import { ChevronDown } from "lucide-react";
import { Children, createContext, forwardRef, isValidElement, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { FloatingPanel } from "./popover";

type SelectContextValue = {
  value: string;
  open: boolean;
  disabled: boolean;
  contentId: string;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  setOpen: (open: boolean) => void;
  selectValue: (value: string) => void;
  labels: Map<string, string>;
};

const SelectContext = createContext<SelectContextValue | null>(null);

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

export function Select({ value: controlledValue, defaultValue = "", onValueChange, disabled = false, children, className }: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentId = useId();
  const value = controlledValue ?? uncontrolledValue;
  const labels = useMemo(() => collectOptionLabels(children), [children]);

  const selectValue = useCallback((nextValue: string) => {
    setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, [onValueChange]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      const content = document.getElementById(contentId);
      if (!triggerRef.current?.contains(target) && !content?.contains(target)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = Array.from(document.getElementById(contentId)?.querySelectorAll<HTMLButtonElement>("[data-select-item]") || []);
      if (items.length === 0) return;
      event.preventDefault();
      const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
      const selectedIndex = items.findIndex((item) => item.dataset.value === value);
      const nextIndex = currentIndex < 0 ? Math.max(0, selectedIndex) : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[nextIndex]?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contentId, open, value]);

  const contextValue = useMemo<SelectContextValue>(() => ({ value, open, disabled, contentId, triggerRef, setOpen, selectValue, labels }), [contentId, disabled, labels, open, selectValue, value]);

  return <SelectContext.Provider value={contextValue}><div className={cn("relative", className)}>{children}</div></SelectContext.Provider>;
}

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) throw new Error("Os componentes Select precisam estar dentro de Select.");
  return context;
}

export const SelectTrigger = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(({ className, children, onClick, onKeyDown, type = "button", ...props }, ref) => {
  const context = useSelectContext();
  const setRefs = (node: HTMLButtonElement | null) => {
    context.triggerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  return <button ref={setRefs} type={type} className={cn("flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 text-left text-base text-foreground shadow-none outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 md:text-sm", className)} role="combobox" aria-haspopup="listbox" aria-expanded={context.open} aria-controls={context.contentId} disabled={context.disabled} onClick={(event) => { context.setOpen(!context.open); onClick?.(event); }} onKeyDown={(event) => { if (!context.open && (event.key === "Enter" || event.key === " " || event.key === "ArrowDown")) { event.preventDefault(); context.setOpen(true); } onKeyDown?.(event); }} {...props}>{children}<ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 text-slate-500 transition-transform duration-200", context.open && "rotate-180")} /></button>;
});
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder = "Selecione uma opção" }: { placeholder?: string }) {
  const context = useSelectContext();
  return <span className={cn("truncate", !context.value && "text-muted-foreground")}>{context.labels.get(context.value) || placeholder}</span>;
}

export function SelectContent({ children, className }: { children: ReactNode; className?: string }) {
  const context = useSelectContext();
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!context.open) return;
    const selected = contentRef.current?.querySelector<HTMLButtonElement>('[data-select-item][aria-selected="true"]');
    selected?.focus();
  }, [context.open]);
  return <FloatingPanel open={context.open} anchorRef={context.triggerRef} id={context.contentId} role="listbox" matchAnchorWidth className={cn("p-1", className)} ref={contentRef}>{children}</FloatingPanel>;
}

export function SelectItem({ value, children, disabled = false }: { value: string; children: string; disabled?: boolean }) {
  const context = useSelectContext();
  const selected = context.value === value;
  return <button type="button" role="option" aria-selected={selected} data-select-item data-value={value} disabled={disabled || context.disabled} className={cn("flex min-h-10 w-full cursor-pointer items-center rounded-md px-3 text-left text-sm text-slate-800 outline-none transition-colors duration-150 hover:bg-sky-50 hover:text-sky-950 focus-visible:bg-sky-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", selected && "bg-sky-50 font-semibold text-sky-900")} onClick={() => context.selectValue(value)}>{children}</button>;
}

function collectOptionLabels(children: ReactNode): Map<string, string> {
  const labels = new Map<string, string>();
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== SelectContent) return;
    const content = child as ReactElement<{ children?: ReactNode }>;
    Children.forEach(content.props.children, (option) => {
      if (!isValidElement(option) || option.type !== SelectItem) return;
      const item = option as ReactElement<{ value: string; children: string }>;
      labels.set(item.props.value, item.props.children);
    });
  });
  return labels;
}
