import { ArrowRight, LogIn } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { FullPageMessage } from "../../components/auth-guard";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../hooks/use-auth";

export function LoginPage() {
  const { user, profile, authError, signIn } = useAuth();
  const [isPending, setIsPending] = useState(false);
  if (user && profile?.allowed) return <Navigate to="/dashboard" replace />;
  if (user && !profile && authError) return <FullPageMessage title="Não foi possível entrar" description={authError} />;

  async function handleSignIn() {
    setIsPending(true);
    try { await signIn(); } catch { /* o erro é refletido na próxima atualização da sessão */ }
    finally { setIsPending(false); }
  }

  return <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(24rem,34rem)]"><section className="hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-white/15 font-bold">J</div><span className="font-bold tracking-tight">JDeniz</span></div><div className="max-w-md space-y-5"><p className="text-sm font-semibold text-primary-foreground/70">Seu espaço de treino</p><h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.03em]">Mais clareza para acompanhar cada aluno.</h1><p className="max-w-sm text-base leading-7 text-primary-foreground/80">Uma base simples para organizar seus alunos hoje e construir sua rotina de acompanhamento amanhã.</p></div><p className="text-sm text-primary-foreground/60">Acesso privado para usuários autorizados.</p></section><section className="flex items-center justify-center px-5 py-12"><div className="w-full max-w-sm space-y-8"><div className="space-y-4"><div className="grid size-12 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground lg:hidden">J</div><div><p className="text-sm font-semibold text-primary">JDeniz</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Bem-vindo de volta</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Entre com sua conta Google para acessar seus alunos.</p></div></div><div className="space-y-3"><Button className="w-full" onClick={() => void handleSignIn()} disabled={isPending}><LogIn className="size-4" />{isPending ? "Abrindo acesso…" : "Entrar com Google"}<ArrowRight className="ml-auto size-4" /></Button>{authError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm leading-5 text-destructive">{authError}</p>}</div><p className="text-center text-xs leading-5 text-muted-foreground">Apenas contas previamente autorizadas podem acessar a plataforma.</p></div></section></main>;
}
