import { useState } from "react";
import { Navigate } from "react-router-dom";
import { FullPageMessage } from "../../components/auth-guard";
import { BrandLogo } from "../../components/brand-logo";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { DottedGlowBackground } from "../../components/ui/dotted-glow-background";
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

  return <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-sky-50 px-5 py-12 pb-24 sm:px-8"><DottedGlowBackground gap={14} radius={1.6} color="rgba(12, 74, 110, 0.22)" glowColor="rgba(14, 165, 233, 0.8)" opacity={0.45} speedScale={0.65} /><Card className="relative z-10 w-full max-w-sm border-sky-100 bg-white/95"><CardContent className="space-y-7 p-7 sm:p-8"><div className="space-y-5"><BrandLogo /><div><h1 className="text-3xl font-bold tracking-tight">Bem-vindo</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Entre com sua conta Google para acessar seus alunos.</p></div></div><div className="space-y-3"><Button variant="secondary" className="h-11 w-full cursor-pointer rounded-md border border-[#747775] bg-white px-3 font-medium text-[#1f1f1f] hover:bg-[#f8fafd] hover:text-[#1f1f1f] focus-visible:ring-sky-500" onClick={() => void handleSignIn()} disabled={isPending}><GoogleIcon />{isPending ? "Abrindo acesso…" : "Entrar com Google"}</Button>{authError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm leading-5 text-destructive">{authError}</p>}</div></CardContent></Card><footer className="absolute inset-x-0 bottom-5 z-10 text-center text-xs text-slate-500">© {new Date().getFullYear()} · Desenvolvido por <a className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 transition-colors hover:text-sky-900" href="https://isumi.com.br/" target="_blank" rel="noreferrer">isumi.</a></footer></main>;
}

function GoogleIcon() {
  return <svg aria-hidden="true" className="size-5 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.15c1.85-1.7 2.9-4.2 2.9-7.42Z" /><path fill="#34A853" d="M12 21.6c2.64 0 4.86-.87 6.48-2.36l-3.15-2.45c-.87.58-1.98.92-3.33.92-2.56 0-4.73-1.73-5.51-4.05H3.23v2.53A9.79 9.79 0 0 0 12 21.6Z" /><path fill="#FBBC05" d="M6.49 13.66A5.9 5.9 0 0 1 6.18 12c0-.58.1-1.14.31-1.66V7.81H3.23A9.8 9.8 0 0 0 2.2 12c0 1.58.38 3.07 1.03 4.19l3.26-2.53Z" /><path fill="#EA4335" d="M12 6.29c1.44 0 2.73.5 3.75 1.48l2.81-2.81C16.85 3.38 14.63 2.4 12 2.4a9.79 9.79 0 0 0-8.77 5.41l3.26 2.53C7.27 8.02 9.44 6.29 12 6.29Z" /></svg>;
}
