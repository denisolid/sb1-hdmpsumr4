import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login, register } from "@/lib/api/auth";
import type {
  AuthState,
  LoginCredentials,
  RegisterCredentials,
} from "@/types/auth";
import { apiClient } from "@/lib/api/client";

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { user, token } = await login(credentials);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          // Store token in localStorage
          localStorage.setItem("token", token);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await register(credentials);
          set({ isLoading: false });
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint
          await apiClient.post("/auth/logout");

          // Clear local storage
          localStorage.removeItem("token");

          // Reset store state
          set({
            user: null,
            isAuthenticated: false,
          });
        } catch (error) {
          console.error("Logout error:", error);
          // Still clear local state even if API call fails
          localStorage.removeItem("token");
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
