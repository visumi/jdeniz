import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { BrandLogo } from "./brand-logo";
import { Button } from "./ui/button";

export function AuthGuard() {
  const { ready, user, profile, profileLoading, authError, signOutUser } = useAuth();
  if (!ready || (user && profileLoading)) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.allowed) {
    return <FullPageMessage title="Acesso pendente" description={authError || "Esta conta ainda não tem permissão para entrar no JDeniz."} action={<Button variant="secondary" onClick={() => void signOutUser()}>Sair da conta</Button>} />;
  }
  return <Outlet />;
}

export function FullPageMessage({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <main className="auth-message-screen grid min-h-dvh place-items-center bg-background px-5 py-10 text-center"><div className="w-full max-w-sm space-y-7"><BrandLogo showName={false} className="mx-auto justify-center" /><div className="space-y-2"><h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>{description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</div></main>;
}
