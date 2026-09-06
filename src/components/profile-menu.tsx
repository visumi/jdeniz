import { LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import packageJson from "../../package.json";

type ProfileMenuProps = {
  displayName: string;
  photoURL?: string | null;
  signOutUser: () => Promise<void>;
};

export function ProfileMenu({ displayName, photoURL, signOutUser }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImageError(false);
  }, [photoURL]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await signOutUser();
  }

  const fallbackInitial = displayName.trim().charAt(0).toUpperCase() || "P";

  return <div ref={menuRef} className="relative"><button type="button" aria-label="Abrir menu da conta" aria-haspopup="menu" aria-expanded={open} className={cn("grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full bg-sky-100 text-sm font-bold text-sky-700 ring-2 ring-sky-200 ring-offset-2 ring-offset-background transition-shadow duration-200 hover:ring-sky-400 focus-visible:ring-4", open && "ring-sky-500")} onClick={() => setOpen((current) => !current)}>{photoURL && !imageError ? <img src={photoURL} alt={`Foto de ${displayName}`} className="size-full object-cover" onError={() => setImageError(true)} /> : fallbackInitial}</button><div role="menu" aria-label="Menu da conta" aria-hidden={!open} data-state={open ? "open" : "closed"} className="ui-popover absolute right-0 top-[calc(100%+0.75rem)] z-50 min-w-36 rounded-lg border border-border bg-white p-1 shadow-[0_4px_8px_rgba(15,23,42,0.16)]"><div className="border-b border-border/70 px-3 py-2 text-xs text-slate-500">Versão {packageJson.version}</div><button type="button" tabIndex={open ? 0 : -1} role="menuitem" className="flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50" onClick={() => void handleSignOut()}><LogOut className="size-4" />Sair</button></div></div>;
}
