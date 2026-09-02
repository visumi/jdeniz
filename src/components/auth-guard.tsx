import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { Button } from "./ui/button";

export function AuthGuard() {
  const { ready, user, profile, authError, signOutUser } = useAuth();
  if (!ready) return <FullPageMessage title="Preparando seu espaço" description="Só um instante…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.allowed) {
    return <FullPageMessage title="Acesso pendente" description={authError || "Esta conta ainda não tem permissão para entrar no JDeniz."} action={<Button variant="secondary" onClick={() => void signOutUser()}>Sair da conta</Button>} />;
  }
  return <Outlet />;
}

export function FullPageMessage({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <main className="grid min-h-dvh place-items-center bg-background px-5 text-center"><div className="max-w-sm space-y-4"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground font-bold">J</div><h1 className="text-2xl font-bold tracking-tight">{title}</h1><p className="text-sm leading-6 text-muted-foreground">{description}</p>{action}</div></main>;
}
