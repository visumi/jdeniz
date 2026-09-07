import { createContext, useContext, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

type ToggleGroupContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

export function ToggleGroup({ value, onValueChange, className, children, ...props }: HTMLAttributes<HTMLDivElement> & { value: string; onValueChange: (value: string) => void; children: ReactNode }) {
  return <ToggleGroupContext.Provider value={{ value, onValueChange }}><div role="radiogroup" className={cn("flex items-center gap-2", className)} {...props}>{children}</div></ToggleGroupContext.Provider>;
}

export function ToggleGroupItem({ value, activeClassName, inactiveClassName, className, children, onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { value: string; activeClassName?: string; inactiveClassName?: string }) {
  const context = useContext(ToggleGroupContext);
  if (!context) throw new Error("Os itens ToggleGroup precisam estar dentro de ToggleGroup.");
  const selected = context.value === value;
  return <button type="button" role="radio" aria-checked={selected} className={cn("inline-flex min-h-9 shrink-0 cursor-pointer items-center justify-center rounded-full border px-3 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", selected ? activeClassName || "border-sky-600 bg-sky-600 text-white" : inactiveClassName || "border-sky-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800", className)} onClick={(event) => { context.onValueChange(value); onClick?.(event); }} {...props}>{children}</button>;
}
