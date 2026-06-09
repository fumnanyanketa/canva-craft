import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

/**
 * Session state. Two modes:
 *  - Real mode: `token` set after login — the app talks to the backend API
 *    (real accounts, real scheduled posts, real publishing).
 *  - Demo mode: no token, `demoMode` true — the app runs on generated data
 *    exactly like the original prototype (nothing leaves the browser).
 */
interface AuthState {
  token: string | null;
  user: AuthUser | null;
  demoMode: boolean;
  setSession: (token: string, user: AuthUser) => void;
  enterDemo: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      demoMode: false,
      setSession: (token, user) => set({ token, user, demoMode: false }),
      enterDemo: () => set({ token: null, user: null, demoMode: true }),
      logout: () => set({ token: null, user: null, demoMode: false }),
    }),
    { name: "metricool-lite:auth" }
  )
);

/** True when the app should talk to the real backend. */
export const useIsReal = () => useAuthStore((s) => !!s.token);
