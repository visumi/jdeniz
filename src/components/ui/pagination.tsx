import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const Pagination = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(({ className, ...props }, ref) => <nav ref={ref} role="navigation" aria-label="Paginação" className={cn("mx-auto flex w-full justify-center", className)} {...props} />);
Pagination.displayName = "Pagination";

export const PaginationContent = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(({ className, ...props }, ref) => <ul ref={ref} className={cn("flex items-center gap-1", className)} {...props} />);
PaginationContent.displayName = "PaginationContent";

export const PaginationItem = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(({ className, ...props }, ref) => <li ref={ref} className={cn("", className)} {...props} />);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean };

export const PaginationLink = forwardRef<HTMLButtonElement, PaginationLinkProps>(({ className, isActive, type = "button", ...props }, ref) => <button ref={ref} type={type} aria-current={isActive ? "page" : undefined} className={cn("inline-grid size-9 cursor-pointer place-items-center rounded-md border border-transparent text-sm font-medium text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50", isActive && "border-sky-200 bg-sky-50 text-sky-800", className)} {...props} />);
PaginationLink.displayName = "PaginationLink";

export function PaginationPrevious({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <PaginationLink aria-label="Ir para a página anterior" className={cn("w-auto px-2", className)} {...props}><ChevronLeft aria-hidden="true" className="size-4" /><span className="sr-only">Anterior</span></PaginationLink>;
}

export function PaginationNext({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <PaginationLink aria-label="Ir para a próxima página" className={cn("w-auto px-2", className)} {...props}><span className="sr-only">Próxima</span><ChevronRight aria-hidden="true" className="size-4" /></PaginationLink>;
}

export function PaginationEllipsis() {
  return <span aria-hidden="true" className="grid size-9 place-items-center text-slate-400"><MoreHorizontal className="size-4" /></span>;
}
