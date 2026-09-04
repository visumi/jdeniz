import { CircleUserRound, LogOut } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAuth } from "../../hooks/use-auth";

export function AccountPage() {
  const { user, signOutUser } = useAuth();
  return <div className="mx-auto max-w-2xl space-y-6"><div><div className="flex items-center gap-2 text-sm font-semibold text-sky-700"><CircleUserRound className="size-4" />Sua conta</div><h1 className="mt-1 text-3xl font-bold tracking-tight">Perfil</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Gerencie a conta usada para acessar seu espaço.</p></div><Card className="overflow-hidden"><CardHeader className="border-b border-border/70 bg-white/70"><CardTitle>Conta conectada</CardTitle></CardHeader><CardContent className="flex flex-col gap-5 pt-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-sky-100 text-sky-700"><CircleUserRound className="size-5" /></div><div><p className="font-semibold">{user?.displayName || "Professor"}</p><p className="mt-1 text-sm text-muted-foreground">{user?.email}</p></div></div><Button variant="secondary" onClick={() => void signOutUser()}><LogOut className="size-4" />Sair</Button></CardContent></Card></div>;
}
