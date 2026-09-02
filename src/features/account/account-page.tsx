import { LogOut } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAuth } from "../../hooks/use-auth";

export function AccountPage() {
  const { user, signOutUser } = useAuth();
  return <div className="mx-auto max-w-2xl space-y-6"><div><p className="text-sm font-semibold text-primary">Sua conta</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Perfil</h1></div><Card><CardHeader><CardTitle>Conta conectada</CardTitle></CardHeader><CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{user?.displayName || "Professor"}</p><p className="mt-1 text-sm text-muted-foreground">{user?.email}</p></div><Button variant="secondary" onClick={() => void signOutUser()}><LogOut className="size-4" />Sair</Button></CardContent></Card></div>;
}
