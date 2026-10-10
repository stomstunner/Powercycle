import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase, type AuthState } from './auth';

type AuthContextValue = AuthState & {
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: Boolean(supabase),
    session: null,
    user: null,
    configurationError: supabase ? null : 'Authentication is not configured. Add the client Supabase URL and publishable key.',
  });

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      setState({ loading: false, session: data.session, user: data.session?.user ?? null, configurationError: error?.message ?? null });
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setState({ loading: false, session, user: session?.user ?? null, configurationError: null });
    });
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    signOut: async () => {
      if (!supabase) return;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
