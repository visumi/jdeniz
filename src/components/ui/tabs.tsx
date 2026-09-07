import { createContext, useContext, useId, useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  id: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue"> & {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
};

export function Tabs({ defaultValue = "", value, onValueChange, className, children, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const id = useId();
  const currentValue = value ?? internalValue;

  function handleValueChange(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  return <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, id }}><div className={cn("w-full", className)} {...props}>{children}</div></TabsContext.Provider>;
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="tablist" className={cn("inline-flex min-h-11 w-full items-center gap-1 rounded-lg bg-sky-50 p-1", className)} {...props} />;
}

export function TabsTrigger({ value, className, children, onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = useTabsContext();
  const selected = context.value === value;
  const triggerId = `${context.id}-trigger-${value}`;
  const contentId = `${context.id}-content-${value}`;

  return <button type="button" role="tab" id={triggerId} aria-selected={selected} aria-controls={contentId} data-state={selected ? "active" : "inactive"} className={cn("inline-flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 data-[state=active]:bg-white data-[state=active]:text-sky-900 data-[state=active]:shadow-sm", className)} onClick={(event) => { context.onValueChange(value); onClick?.(event); }} {...props}>{children}</button>;
}

export function TabsContent({ value, className, children, ...props }: HTMLAttributes<HTMLDivElement> & { value: string }) {
  const context = useTabsContext();
  const active = context.value === value;
  const triggerId = `${context.id}-trigger-${value}`;
  const contentId = `${context.id}-content-${value}`;

  return <div role="tabpanel" id={contentId} aria-labelledby={triggerId} hidden={!active} data-state={active ? "active" : "inactive"} className={cn("mt-4", !active && "hidden", className)} {...props}>{children}</div>;
}

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Os componentes Tabs precisam estar dentro de Tabs.");
  return context;
}
