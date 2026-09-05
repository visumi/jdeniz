import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Drawer({ open, onOpenChange, title, description, children, footer }: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const dragStartRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) setDragOffset(0);
  }, [open]);

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStartRef.current = event.clientY;
    suppressClickRef.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragStartRef.current === null) return;
    const offset = Math.max(0, event.clientY - dragStartRef.current);
    if (offset > 8) suppressClickRef.current = true;
    setDragOffset(offset);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragStartRef.current === null) return;
    const shouldClose = dragOffset > 96;
    dragStartRef.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (shouldClose) onOpenChange(false);
    else setDragOffset(0);
  }

  function handleHandleClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onOpenChange(false);
  }

  return createPortal(<div className="ui-drawer fixed inset-0 z-50" data-state={open ? "open" : "closed"} aria-hidden={!open}>
    <button type="button" aria-label="Fechar painel" className="ui-drawer-overlay absolute inset-0 h-full w-full cursor-default bg-slate-950/25" tabIndex={open ? 0 : -1} onClick={() => onOpenChange(false)} />
    <section ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className={cn("ui-drawer-panel absolute bottom-0 right-0 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-sky-100 bg-white shadow-[0_4px_8px_rgba(15,23,42,0.16)] lg:bottom-auto lg:left-1/2 lg:right-auto lg:top-1/2 lg:max-h-[min(90dvh,48rem)] lg:w-[min(calc(100%-2rem),40rem)] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-xl", isDragging && "transition-none")} style={dragOffset ? { transform: `translateY(${dragOffset}px)` } : undefined}>
      <button ref={handleRef} type="button" aria-label="Arraste para baixo para fechar" className="flex h-7 w-full shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing lg:hidden" onClick={handleHandleClick} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}><span aria-hidden="true" className="h-1 w-12 rounded-full bg-slate-300 transition-colors hover:bg-slate-400" /></button>
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-sky-100 px-5 pb-4 lg:px-6 lg:pt-6">
        <div className="min-w-0"><h2 id={titleId} className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>{description && <p id={descriptionId} className="mt-1 text-sm leading-5 text-slate-600">{description}</p>}</div>
        <button type="button" aria-label="Fechar modal" className="-mr-2 -mt-1 hidden size-10 shrink-0 cursor-pointer place-items-center rounded-md text-slate-500 transition-colors hover:bg-sky-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-500 lg:grid" onClick={() => onOpenChange(false)}><X aria-hidden="true" className="size-5" /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">{children}</div>
      {footer && <footer className="shrink-0 border-t border-sky-100 bg-white px-5 py-4 md:px-6">{footer}</footer>}
    </section>
  </div>, document.body);
}
