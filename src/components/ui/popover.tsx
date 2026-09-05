import { createPortal } from "react-dom";
import { forwardRef, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { cn } from "../../lib/utils";

type FloatingPanelProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  id?: string;
  role?: string;
  ariaLabel?: string;
  className?: string;
  matchAnchorWidth?: boolean;
};

export const FloatingPanel = forwardRef<HTMLDivElement, FloatingPanelProps>(({ open, anchorRef, children, id, role, ariaLabel, className, matchAnchorWidth = false }, forwardedRef) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  const setRefs = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const anchorRect = anchor.getBoundingClientRect();
      const panelWidth = matchAnchorWidth ? anchorRect.width : panel.offsetWidth || 320;
      const panelHeight = panel.offsetHeight || 320;
      const gap = 8;
      const canOpenBelow = anchorRect.bottom + panelHeight + gap <= window.innerHeight - 8;
      const canOpenAbove = anchorRect.top - panelHeight - gap >= 8;
      const top = canOpenBelow ? anchorRect.bottom + gap : canOpenAbove ? anchorRect.top - panelHeight - gap : Math.min(anchorRect.bottom + gap, window.innerHeight - panelHeight - 8);
      const left = Math.min(Math.max(8, anchorRect.left), Math.max(8, window.innerWidth - panelWidth - 8));
      setStyle({ position: "fixed", top: Math.max(8, top), left, minWidth: matchAnchorWidth ? anchorRect.width : undefined, visibility: "visible" });
    };
    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, matchAnchorWidth, open]);

  if (!open) return null;
  return createPortal(<div ref={setRefs} id={id} role={role} aria-label={ariaLabel} style={style} className={cn("z-[60] max-h-[min(24rem,calc(100dvh-1rem))] overflow-y-auto rounded-xl border border-sky-100 bg-white p-3 text-slate-950 shadow-[0_4px_8px_rgba(15,23,42,0.16)]", className)}>{children}</div>, document.body);
});
FloatingPanel.displayName = "FloatingPanel";
