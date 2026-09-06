import { LayoutDashboard, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { cn } from "../lib/utils";
import { BrandLogo } from "./brand-logo";
import { ProfileMenu } from "./profile-menu";
import { StudentSearch } from "./student-search";

const navigation = [
  { to: "/dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/students", label: "Alunos", icon: Users }
];

function NavigationLink({ to, label, icon: Icon, mobile = false }: { to: string; label: string; icon: typeof Users; mobile?: boolean }) {
  return <NavLink to={to} aria-label={label} className={({ isActive }) => cn("group flex cursor-pointer items-center gap-3 rounded-md text-sm font-semibold transition-colors duration-200", mobile ? "h-11 min-w-0 flex-1 justify-center rounded-full" : "w-full justify-start px-3 py-2.5", isActive ? mobile ? "bg-sky-100 text-sky-700" : "bg-sky-50 text-sky-700" : mobile ? "text-slate-500 hover:bg-sky-50 hover:text-sky-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}><Icon className={cn(mobile ? "size-5" : "size-4")} strokeWidth={2} /><span className={cn(mobile && "sr-only")}>{label}</span></NavLink>;
}

export function AppShell() {
  const { user, signOutUser } = useAuth();
  return <div className="min-h-dvh bg-background">
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border/80 bg-white lg:flex">
      <div className="flex h-16 items-center px-5"><BrandLogo className="min-w-0 px-1" /></div>
      <nav aria-label="Navegação principal" className="flex-1 space-y-1 px-3 py-6">{navigation.map((item) => <NavigationLink key={item.to} {...item} />)}</nav>
    </aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/80 bg-background px-4 sm:gap-4 sm:px-5 lg:px-10"><div className="shrink-0 lg:hidden"><BrandLogo showName={false} /></div><div className="min-w-0 flex-1 lg:mx-auto lg:max-w-md"><StudentSearch /></div><div className="flex shrink-0 items-center gap-3"><ProfileMenu displayName={user?.displayName || "Professor"} photoURL={user?.photoURL} signOutUser={signOutUser} /></div></header><main className="mx-auto max-w-6xl px-5 pb-28 pt-7 lg:px-10 lg:pb-10 lg:pt-10"><Outlet /></main></div>
    <MobileNavigation />
  </div>;
}

function MobileNavigation() {
  const [isVisible, setIsVisible] = useState(true);
  const canScrollRef = useRef(false);
  const hideTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const scheduleHide = () => {
      window.clearTimeout(hideTimerRef.current);
      if (canScrollRef.current) {
        hideTimerRef.current = window.setTimeout(() => setIsVisible(false), 1800);
      }
    };

    const updateScrollableState = () => {
      canScrollRef.current = document.documentElement.scrollHeight > window.innerHeight + 1;
      if (!canScrollRef.current) {
        window.clearTimeout(hideTimerRef.current);
        setIsVisible(true);
        return;
      }
      setIsVisible(true);
      scheduleHide();
    };

    const handleScroll = () => {
      if (!canScrollRef.current) return;
      setIsVisible(true);
      scheduleHide();
    };

    updateScrollableState();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateScrollableState);
    const resizeObserver = new ResizeObserver(updateScrollableState);
    resizeObserver.observe(document.documentElement);

    return () => {
      window.clearTimeout(hideTimerRef.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollableState);
      resizeObserver.disconnect();
    };
  }, []);

  return <nav aria-label="Navegação principal" aria-hidden={!isVisible && canScrollRef.current} className={cn("fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[opacity,visibility] duration-200 lg:hidden", isVisible || !canScrollRef.current ? "visible opacity-100" : "pointer-events-none invisible opacity-0")}><div className="flex w-full items-center gap-1 rounded-full border border-sky-100 bg-white/95 p-1.5 shadow-[0_4px_8px_rgba(15,23,42,0.12)]">{navigation.map((item) => <NavigationLink key={item.to} {...item} mobile />)}</div></nav>;
}
