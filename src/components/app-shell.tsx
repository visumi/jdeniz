import { Dumbbell, LayoutDashboard, LogOut, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

const navigation = [
  { to: "/dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/students", label: "Alunos", icon: Users }
];

function NavigationLink({ to, label, icon: Icon, mobile = false }: { to: string; label: string; icon: typeof Users; mobile?: boolean }) {
  return <NavLink to={to} className={({ isActive }) => cn("group flex items-center gap-3 rounded-lg text-sm font-semibold transition-colors", mobile ? "min-w-20 flex-col gap-1 px-3 py-2 text-xs" : "px-3 py-2.5", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}><Icon className={cn(mobile ? "size-5" : "size-4")} strokeWidth={2} /><span>{label}</span></NavLink>;
}

export function AppShell() {
  const { user, signOutUser } = useAuth();
  const displayName = user?.displayName?.split(" ")[0] || "Professor";
  return <div className="min-h-dvh bg-background">
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-sidebar p-5 lg:flex">
      <div className="flex items-center gap-3 px-2"><div className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">J</div><div><p className="font-bold tracking-tight">JDeniz</p><p className="text-xs text-muted-foreground">Seu espaço de treino</p></div></div>
      <nav className="mt-10 space-y-1">{navigation.map((item) => <NavigationLink key={item.to} {...item} />)}</nav>
      <div className="mt-auto space-y-3 border-t border-border pt-4"><div className="flex items-center gap-3 px-2"><div className="grid size-9 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">{user?.photoURL ? <img src={user.photoURL} alt="" className="size-full object-cover" /> : <span>{displayName.charAt(0)}</span>}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{user?.displayName || "Professor"}</p><p className="truncate text-xs text-muted-foreground">{user?.email}</p></div></div><Button variant="ghost" className="w-full justify-start" onClick={() => void signOutUser()}><LogOut className="size-4" />Sair</Button></div>
    </aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/80 bg-background/95 px-5 backdrop-blur-sm lg:px-10"><div className="flex items-center gap-3 lg:hidden"><div className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">J</div><span className="font-bold">JDeniz</span></div><div className="hidden lg:block" /><div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:inline">Olá, {displayName}</span><div className="grid size-9 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">{user?.photoURL ? <img src={user.photoURL} alt={`Foto de ${user.displayName || "usuário"}`} className="size-full object-cover" /> : displayName.charAt(0)}</div></div></header><main className="mx-auto max-w-6xl px-5 pb-28 pt-7 lg:px-10 lg:pb-10 lg:pt-10"><Outlet /></main></div>
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-sm lg:hidden">{navigation.map((item) => <NavigationLink key={item.to} {...item} mobile />)}</nav>
  </div>;
}
