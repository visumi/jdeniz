import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type ContentStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  tone?: "empty" | "error";
  className?: string;
};

export function ContentState({ title, description, icon: Icon, action, tone = "empty", className }: ContentStateProps) {
  const StateIcon = Icon || (tone === "error" ? AlertCircle : Inbox);
  const isError = tone === "error";

  return <div role={isError ? "alert" : undefined} className={cn("flex min-h-40 flex-col items-center justify-center px-5 py-12 text-center", className)}>
    <span className={cn("grid size-12 place-items-center rounded-2xl", isError ? "bg-red-50 text-red-600" : "bg-sky-50 text-sky-600")}>
      <StateIcon aria-hidden="true" className="size-5" />
    </span>
    <p className="mt-4 font-semibold text-slate-950">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>;
}
