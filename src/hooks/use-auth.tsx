import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { GoogleAuthProvider, onIdTokenChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { apiRequest, ApiError } from "../lib/api";
import { firebaseAuth, firebaseConfigured } from "../lib/firebase";
import { type MeResponse } from "../types/api";

interface AuthContextValue {
  user: User | null;
  profile: MeResponse | null;
  ready: boolean;
  profileLoading: boolean;
  authError: string | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [ready, setReady] = useState(!firebaseConfigured);
  const [profileLoading, setProfileLoading] = useState(firebaseConfigured);
  const [authError, setAuthError] = useState<string | null>(firebaseConfigured ? null : "Configure as credenciais do Firebase para entrar.");

  useEffect(() => {
    if (!firebaseAuth) return;

    return onIdTokenChanged(firebaseAuth, async (nextUser) => {
      setUser(nextUser);
      setReady(true);
      setAuthError(null);
      setProfileLoading(Boolean(nextUser));
      if (!nextUser) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      try {
        const nextProfile = await apiRequest<MeResponse>("/me", {}, await nextUser.getIdToken());
        setProfile(nextProfile);
        if (!nextProfile.allowed) setAuthError("Seu e-mail ainda não está autorizado para acessar o JDeniz.");
      } catch (error) {
        setProfile(null);
        setAuthError(error instanceof ApiError && error.status === 403 ? "Seu e-mail ainda não está autorizado para acessar o JDeniz." : "Não foi possível confirmar sua autorização agora.");
      } finally {
        setProfileLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (ready && !profileLoading) document.getElementById("boot-loading")?.remove();
  }, [profileLoading, ready]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    ready,
    profileLoading,
    authError,
    async signIn() {
      if (!firebaseAuth) throw new Error("firebase_not_configured");
      setAuthError(null);
      await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    },
    async signOutUser() {
      if (firebaseAuth) await signOut(firebaseAuth);
      setUser(null);
      setProfile(null);
    }
  }), [authError, profile, profileLoading, ready, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
