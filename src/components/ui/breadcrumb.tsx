import { ChevronRight } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Breadcrumb({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <nav aria-label="Navegação estrutural" className={cn("text-sm", className)} {...props} />;
}

export function BreadcrumbList({ className, ...props }: HTMLAttributes<HTMLOListElement>) {
  return <ol className={cn("flex flex-wrap items-center gap-1.5 text-slate-500", className)} {...props} />;
}

export function BreadcrumbItem({ className, ...props }: HTMLAttributes<HTMLLIElement>) {
  return <li className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
}

export function BreadcrumbLink({ asChild = false, children, className, ...props }: HTMLAttributes<HTMLAnchorElement> & { asChild?: boolean; children?: ReactNode }) {
  const Comp = asChild ? Slot : "a";
  return <Comp className={cn("transition-colors hover:text-sky-700", className)} {...props}>{children}</Comp>;
}

export function BreadcrumbPage({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span aria-current="page" className={cn("font-semibold text-slate-950", className)} {...props} />;
}

export function BreadcrumbSeparator({ className }: { className?: string }) {
  return <li aria-hidden="true" className={cn("text-slate-300", className)}><ChevronRight className="size-4" /></li>;
}
